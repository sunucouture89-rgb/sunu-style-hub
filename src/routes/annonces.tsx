import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, MessageCircle, Search, Sparkles, BadgeCheck, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/annonces")({
  component: AnnoncesPage,
  head: () => ({
    meta: [
      { title: "Annonces — Sunu Couture" },
      { name: "description", content: "Découvrez les créations des couturiers sénégalais : boubous, robes africaines, tenues de mariage, broderies." },
      { property: "og:title", content: "Toutes les annonces — Sunu Couture" },
      { property: "og:description", content: "Catalogue complet de couture sénégalaise premium." },
      { rel: "canonical", href: "/annonces" } as any,
    ],
  }),
});

type Category = { slug: string; label: string; emoji: string | null };

type Listing = {
  id: string;
  title: string;
  price_xof: number;
  city: string | null;
  category: string;
  cover_image_url: string | null;
  is_premium: boolean;
  views_count: number;
  created_at: string;
  couturier_id: string;
  whatsapp_number: string | null;
  delivery_available: boolean;
  profiles?: { display_name: string | null; avatar_url: string | null; is_verified: boolean | null; whatsapp_number: string | null } | null;
};

type Sort = "premium" | "recent" | "popular" | "price_asc" | "price_desc";

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function AnnoncesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("premium");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("categories").select("*").order("position");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { category, city, minPrice, maxPrice, premiumOnly, sort, search }],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("*, profiles:profiles!listings_couturier_id_fkey(display_name, avatar_url, is_verified, whatsapp_number)")
        .eq("status", "active")
        .limit(60);

      if (category) q = q.eq("category", category);
      if (city) q = q.ilike("city", `%${city}%`);
      if (minPrice) q = q.gte("price_xof", Number(minPrice));
      if (maxPrice) q = q.lte("price_xof", Number(maxPrice));
      if (premiumOnly) q = q.eq("is_premium", true);
      if (search) q = q.ilike("title", `%${search}%`);

      if (sort === "premium") q = q.order("is_premium", { ascending: false }).order("created_at", { ascending: false });
      else if (sort === "recent") q = q.order("created_at", { ascending: false });
      else if (sort === "popular") q = q.order("views_count", { ascending: false });
      else if (sort === "price_asc") q = q.order("price_xof", { ascending: true });
      else if (sort === "price_desc") q = q.order("price_xof", { ascending: false });

      const { data, error } = await q;
      if (error) {
        // Fallback without joined profile if FK alias not present
        const { data: d2, error: e2 } = await supabase.from("listings").select("*").eq("status", "active").limit(60);
        if (e2) throw e2;
        return d2 as Listing[];
      }
      const rows = (data as any[]) ?? [];
      return rows.filter((r) => !verifiedOnly || r.profiles?.is_verified) as Listing[];
    },
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data }) => setFavorites(new Set((data ?? []).map((r: any) => r.listing_id))));
  }, [user]);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }
    const next = new Set(favorites);
    if (next.has(id)) {
      next.delete(id);
      setFavorites(next);
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
    } else {
      next.add(id);
      setFavorites(next);
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: id });
    }
  };

  const resetFilters = () => {
    setSearch(""); setCategory(""); setCity(""); setMinPrice(""); setMaxPrice("");
    setPremiumOnly(false); setVerifiedOnly(false); setSort("premium");
  };

  const activeFilterCount = useMemo(
    () => [category, city, minPrice, maxPrice, premiumOnly, verifiedOnly, search].filter(Boolean).length,
    [category, city, minPrice, maxPrice, premiumOnly, verifiedOnly, search],
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-28 pb-8 px-6 lg:px-10 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight">Toutes les <span className="italic gold-text">annonces</span></h1>
            <p className="mt-2 text-foreground/70">Créations cousues main par les couturiers du Sénégal.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground/60">Trier :</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-border bg-card px-3 py-2 text-sm">
              <option value="premium">Premium d'abord</option>
              <option value="recent">Plus récents</option>
              <option value="popular">Plus populaires</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        {/* Search + categories */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher : boubou, mariage, brodé…"
              className="w-full rounded-full border border-border bg-card pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary">
            <SlidersHorizontal className="h-4 w-4" /> Filtres {activeFilterCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{activeFilterCount}</span>}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <CatChip active={!category} onClick={() => setCategory("")} label="Toutes" />
          {categories.map((c) => (
            <CatChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)} label={`${c.emoji ?? ""} ${c.label}`} />
          ))}
        </div>

        {showFilters && (
          <div className="mt-5 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <Field label="Ville"><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dakar, Thiès…" className="catalog-input" /></Field>
              <Field label="Prix min (FCFA)"><input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="catalog-input" /></Field>
              <Field label="Prix max (FCFA)"><input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="catalog-input" /></Field>
              <div className="flex flex-col gap-2 pt-5">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={premiumOnly} onChange={(e) => setPremiumOnly(e.target.checked)} /> Premium uniquement</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Couturiers vérifiés</label>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="mt-4 inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground">
                <X className="h-3.5 w-3.5" /> Réinitialiser
              </button>
            )}
          </div>
        )}
      </section>

      <section className="px-6 lg:px-10 max-w-7xl mx-auto pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-lg">Aucune annonce ne correspond à vos critères.</p>
            <button onClick={resetFilters} className="mt-4 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Réinitialiser les filtres</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => (
              <AdCard key={l.id} listing={l} isFavorite={favorites.has(l.id)} onToggleFavorite={() => toggleFavorite(l.id)} />
            ))}
          </div>
        )}
      </section>

      <Footer />

      <style>{`.catalog-input{width:100%;border-radius:0.5rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.catalog-input:focus{border-color:hsl(var(--primary))}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-foreground/60">{label}</span>
      {children}
    </label>
  );
}

function CatChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-4 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}>
      {label}
    </button>
  );
}

function AdCard({ listing, isFavorite, onToggleFavorite }: { listing: Listing; isFavorite: boolean; onToggleFavorite: () => void }) {
  const wa = listing.profiles?.whatsapp_number || listing.whatsapp_number;
  const waLink = wa ? `https://wa.me/${wa.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par : ${listing.title}`)}` : null;

  return (
    <article className={`group relative overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-luxe ${listing.is_premium ? "border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_8px_24px_-12px_hsl(var(--primary)/0.4)]" : "border-border"}`}>
      <Link to="/annonces/$id" params={{ id: listing.id }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {listing.cover_image_url ? (
            <img src={listing.cover_image_url} alt={listing.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full w-full place-items-center text-foreground/30">Pas d'image</div>
          )}
          {listing.is_premium && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black shadow">
              <Sparkles className="h-3 w-3" /> Sponsorisé
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
        aria-label="Favori"
        className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${isFavorite ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link to="/annonces/$id" params={{ id: listing.id }} className="flex-1 min-w-0">
            <h3 className="truncate font-medium text-foreground group-hover:text-primary transition">{listing.title}</h3>
          </Link>
          <span className="shrink-0 text-sm font-semibold text-primary">{fmtFCFA(listing.price_xof)}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
          {listing.profiles?.avatar_url ? (
            <img src={listing.profiles.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <span className="h-5 w-5 rounded-full bg-muted" />
          )}
          <span className="truncate">{listing.profiles?.display_name ?? "Couturier"}</span>
          {listing.profiles?.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          {listing.city && (
            <span className="ml-auto inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {listing.city}</span>
          )}
        </div>

        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
