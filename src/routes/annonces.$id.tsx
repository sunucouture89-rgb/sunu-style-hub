import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Flag, Heart, MapPin, MessageCircle, Share2, Sparkles, Star, Truck, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/annonces/$id")({
  component: AdDetailPage,
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("listings").select("id, title, description, cover_image_url, price_xof, city, category, status").eq("id", params.id).maybeSingle();
    if (error || !data) throw notFound();
    return { listing: data };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.listing;
    if (!l) return { meta: [{ title: "Annonce — Sunu Couture" }] };
    return {
      meta: [
        { title: `${l.title} — Sunu Couture` },
        { name: "description", content: (l.description || `${l.title} — couture sénégalaise`).slice(0, 160) },
        { property: "og:title", content: l.title },
        { property: "og:description", content: (l.description || "Création couture sénégalaise").slice(0, 160) },
        ...(l.cover_image_url ? [{ property: "og:image", content: l.cover_image_url }] : []),
      ],
      links: [
        { rel: "canonical", href: `/annonces/${l.id}` },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          name: l.title,
          description: l.description,
          image: l.cover_image_url,
          offers: { "@type": "Offer", priceCurrency: "XOF", price: l.price_xof, availability: "https://schema.org/InStock" },
        }),
      }],
    };
  },
});

type FullListing = any;

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function AdDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [isFav, setIsFav] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const [{ data: listing }, { data: images }, { data: videos }] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).single(),
        supabase.from("listing_images").select("*").eq("listing_id", id).order("position"),
        (supabase as any).from("ad_videos").select("*").eq("listing_id", id).order("position"),
      ]);
      if (!listing) return null;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", (listing as any).couturier_id).maybeSingle();
      const { data: reviews } = await supabase.from("reviews").select("*").eq("listing_id", id).order("created_at", { ascending: false });
      const { data: related } = await supabase.from("listings").select("id, title, cover_image_url, price_xof, city").eq("category", (listing as any).category).eq("status", "active").neq("id", id).limit(4);
      // increment views
      await supabase.from("listings").update({ views_count: ((listing as any).views_count ?? 0) + 1 } as any).eq("id", id);
      return { listing, images: images ?? [], videos: videos ?? [], profile, reviews: reviews ?? [], related: related ?? [] };
    },
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("favorites").select("listing_id").eq("user_id", user.id).eq("listing_id", id).maybeSingle().then(({ data }) => setIsFav(!!data));
  }, [user, id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background"><Navbar /><div className="pt-32 px-6 max-w-6xl mx-auto"><div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" /></div></main>
    );
  }
  if (!data?.listing) {
    return (
      <main className="min-h-screen bg-background"><Navbar /><div className="pt-32 text-center"><p>Annonce introuvable.</p><Link to="/annonces" className="mt-4 inline-block text-primary">← Retour aux annonces</Link></div></main>
    );
  }

  const l: FullListing = data.listing;
  const allImages: { url: string }[] = [
    ...(l.cover_image_url ? [{ url: l.cover_image_url }] : []),
    ...data.images.filter((i: any) => i.url !== l.cover_image_url).map((i: any) => ({ url: i.url })),
  ];
  const cover = allImages[activeImg]?.url ?? l.cover_image_url;
  const wa = data.profile?.whatsapp_number || l.whatsapp_number;
  const waLink = wa ? `https://wa.me/${wa.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce : ${l.title} (${fmtFCFA(l.price_xof)})`)}` : null;
  const avgRating = data.reviews.length ? data.reviews.reduce((s: number, r: any) => s + r.rating, 0) / data.reviews.length : 0;

  const toggleFav = async () => {
    if (!user) { toast.error("Connectez-vous pour ajouter aux favoris"); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: id });
      setIsFav(true);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: l.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Lien copié"); }
    } catch {}
  };

  const startChat = async () => {
    if (!user) { toast.error("Connectez-vous pour discuter"); return; }
    if (user.id === l.couturier_id) { toast.error("C'est votre propre annonce"); return; }
    const { data: existing } = await supabase.from("conversations").select("id").eq("client_id", user.id).eq("couturier_id", l.couturier_id).eq("listing_id", id).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: c, error } = await supabase.from("conversations").insert({ client_id: user.id, couturier_id: l.couturier_id, listing_id: id }).select("id").single();
      if (error) { toast.error(error.message); return; }
      convId = c.id;
    }
    window.location.href = `/messages?conversation=${convId}`;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24 pb-16 px-6 lg:px-10 max-w-6xl mx-auto">
        <Link to="/annonces" className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Toutes les annonces
        </Link>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted group">
              {cover ? (
                <>
                  <img src={cover} alt={l.title} className={`h-full w-full object-cover transition-transform duration-500 ${zoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in group-hover:scale-105"}`} onClick={() => setZoom((z) => !z)} />
                  {l.is_premium && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-3 py-1 text-xs font-semibold text-black">
                      <Sparkles className="h-3.5 w-3.5" /> Annonce premium
                    </span>
                  )}
                  <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition" onClick={() => setZoom((z) => !z)}>
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </>
              ) : <div className="grid h-full w-full place-items-center text-foreground/30">Pas d'image</div>}
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden rounded-lg border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {data.videos.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.videos.map((v: any) => (
                  <video key={v.id} src={v.url} controls className="w-full rounded-xl bg-black" />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <aside>
            <h1 className="font-display text-3xl md:text-4xl leading-tight">{l.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
              {l.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {l.city}</span>}
              {avgRating > 0 && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} ({data.reviews.length})</span>}
              <span className="ml-auto">{l.views_count ?? 0} vues</span>
            </div>

            <div className="mt-5 text-3xl font-semibold text-primary">{fmtFCFA(l.price_xof)}</div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {l.category && <Pill>{l.category}</Pill>}
              {l.fabric && <Pill>Tissu : {l.fabric}</Pill>}
              {l.gender && <Pill>{l.gender}</Pill>}
              {l.delivery_days && <Pill>Délai : {l.delivery_days} j</Pill>}
              {l.delivery_available && <Pill><Truck className="inline h-3 w-3 mr-1" />Livraison</Pill>}
              {l.stock > 0 && <Pill>Stock : {l.stock}</Pill>}
            </div>

            {Array.isArray(l.tags) && l.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.tags.map((t: string) => <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-foreground/70">#{t}</span>)}
              </div>
            )}

            <div className="mt-6 flex gap-2">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <button onClick={startChat} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
                Discuter dans l'app
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={toggleFav} className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm ${isFav ? "border-red-500 text-red-500" : "border-border hover:bg-secondary"}`}>
                <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} /> {isFav ? "Favori" : "Ajouter aux favoris"}
              </button>
              <button onClick={share} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary">
                <Share2 className="h-4 w-4" />
              </button>
              <button onClick={() => toast.success("Signalement envoyé")} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary" title="Signaler">
                <Flag className="h-4 w-4" />
              </button>
            </div>

            {/* Couturier card */}
            {data.profile && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                {data.profile.avatar_url ? (
                  <img src={data.profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : <div className="h-12 w-12 rounded-full bg-muted" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium truncate">{data.profile.atelier_name || data.profile.display_name || "Couturier"}</span>
                    {data.profile.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                  </div>
                  {data.profile.city && <p className="text-xs text-foreground/60">{data.profile.city}</p>}
                </div>
              </div>
            )}

            {l.description && (
              <div className="mt-6">
                <h2 className="font-display text-lg mb-2">Description</h2>
                <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">{l.description}</p>
              </div>
            )}
          </aside>
        </div>

        {/* Reviews */}
        {data.reviews.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl mb-4">Avis ({data.reviews.length})</h2>
            <div className="space-y-3">
              {data.reviews.map((r: any) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {data.related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl mb-4">Autres créations similaires</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {data.related.map((r: any) => (
                <Link key={r.id} to="/annonces/$id" params={{ id: r.id }} className="group">
                  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                    {r.cover_image_url && <img src={r.cover_image_url} alt={r.title} className="h-full w-full object-cover transition group-hover:scale-105" />}
                  </div>
                  <div className="mt-2 text-sm truncate">{r.title}</div>
                  <div className="text-xs text-primary">{fmtFCFA(r.price_xof)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile WhatsApp FAB */}
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="lg:hidden fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-luxe">
          <MessageCircle className="h-6 w-6" />
        </a>
      )}

      <Footer />
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1">{children}</span>;
}
