import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Instagram,
  MessageCircle,
  BadgeCheck,
  Heart,
  Users,
  Star,
  Package,
  Globe,
  Music2,
  Facebook,
  ImagePlus,
  Play,
  Expand,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Lightbox } from "@/components/Lightbox";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const { data: shop, error } = await supabase
      .from("shops")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !shop) throw notFound();

    const [{ data: listings }, { data: media }] = await Promise.all([
      supabase
        .from("listings")
        .select("id, title, price_xof, cover_image_url, city, is_premium, views_count")
        .eq("couturier_id", shop.couturier_id)
        .eq("status", "active")
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60),
      (supabase as any)
        .from("shop_media")
        .select("id, url, kind, caption, position")
        .eq("shop_id", shop.id)
        .order("position", { ascending: true })
        .limit(60),
    ]);

    return { shop, listings: listings ?? [], media: media ?? [] };
  },

  head: ({ loaderData }) => {
    const shop = loaderData?.shop;
    if (!shop) return { meta: [{ title: "Boutique introuvable — Sunu Couture" }] };
    const title = `${shop.name} — Boutique sur Sunu Couture`;
    const desc = shop.tagline || shop.description?.slice(0, 150) || `Découvrez les créations de ${shop.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(shop.cover_url ? [{ property: "og:image", content: shop.cover_url }] : []),
      ],
    };
  },
  component: ShopPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-slate-500">
      <div className="text-center">
        <p className="font-display text-2xl">Boutique introuvable</p>
        <Link to="/" className="mt-4 inline-block text-emerald-600 underline">Retour à l'accueil</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center text-slate-500">
      Une erreur est survenue : {error.message}
    </div>
  ),
});

function ShopPage() {
  const { shop, listings, media } = Route.useLoaderData();
  const { user } = useAuth();
  const isOwner = user?.id === shop.couturier_id;
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(shop.followers_count);
  const [busy, setBusy] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);


  useEffect(() => {
    if (!user) return;
    supabase
      .from("shop_followers")
      .select("user_id")
      .eq("shop_id", shop.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setFollowing(!!data));
  }, [user, shop.id]);

  const toggleFollow = async () => {
    if (!user) {
      toast.error("Connectez-vous pour suivre cette boutique");
      return;
    }
    setBusy(true);
    if (following) {
      await supabase.from("shop_followers").delete().eq("shop_id", shop.id).eq("user_id", user.id);
      setFollowing(false);
      setFollowers((n: number) => Math.max(0, n - 1));
    } else {
      const { error } = await supabase.from("shop_followers").insert({ shop_id: shop.id, user_id: user.id });
      if (error) toast.error(error.message);
      else {
        setFollowing(true);
        setFollowers((n: number) => n + 1);
        toast.success(`Vous suivez ${shop.name}`);
      }
    }
    setBusy(false);
  };

  const waLink = shop.whatsapp
    ? `https://wa.me/${shop.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${shop.name}, je vous contacte via Sunu Couture.`)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 sm:h-72">
        {shop.cover_url && (
          <img src={shop.cover_url} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        {/* Header card */}
        <div
          className="-mt-16 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:-mt-20 sm:flex-row sm:items-end"
        >
          <div className="relative -mt-16 h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-white sm:-mt-20 sm:h-32 sm:w-32">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-display text-slate-400">
                {shop.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-2xl sm:text-3xl">{shop.name}</h1>
              {shop.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> Vérifié
                </span>
              )}
            </div>
            {shop.tagline && <p className="mt-1 text-sm text-slate-600">{shop.tagline}</p>}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              {shop.city && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {shop.city}{shop.country ? `, ${shop.country}` : ""}</span>
              )}
              <span className="inline-flex items-center gap-1"><Package className="h-3 w-3" /> {listings.length} produit{listings.length > 1 ? "s" : ""}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {followers} abonné{followers > 1 ? "s" : ""}</span>
              {shop.rating_count > 0 && (
                <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(shop.rating_avg).toFixed(1)} ({shop.rating_count})</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                following ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              <Heart className={`h-4 w-4 ${following ? "fill-rose-500 text-rose-500" : ""}`} />
              {following ? "Suivi" : "Suivre"}
            </button>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* About + socials */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="font-display text-lg">À propos</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {shop.description || "Cette boutique n'a pas encore ajouté de description."}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <h2 className="font-display text-lg">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {shop.phone && (
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {shop.phone}</li>
              )}
              {shop.address && (
                <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /> {shop.address}</li>
              )}
            </ul>
            <div className="mt-4 flex gap-3">
              {shop.instagram && (
                <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><Instagram className="h-4 w-4" /></a>
              )}
              {shop.tiktok && (
                <a href={shop.tiktok} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><Music2 className="h-4 w-4" /></a>
              )}
              {shop.facebook && (
                <a href={shop.facebook} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><Facebook className="h-4 w-4" /></a>
              )}
              {shop.website && (
                <a href={shop.website} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"><Globe className="h-4 w-4" /></a>
              )}
            </div>
          </div>
        </div>

        {/* Gallery — photos & videos */}
        {(media.length > 0 || isOwner) && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl">Photos & vidéos</h2>
                <p className="text-sm text-slate-500">
                  La galerie personnelle de {shop.name}
                </p>
              </div>
              {isOwner && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <ImagePlus className="h-4 w-4" /> Ajouter des médias
                </Link>
              )}
            </div>
            {media.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">
                  Aucun média dans la galerie pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {media.map((m: any, i: number) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLightboxIdx(i)}
                    className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                  >
                    {m.kind === "video" ? (
                      <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={m.url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    )}
                    <span className="absolute inset-0 grid place-items-center transition group-hover:bg-black/30">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                        {m.kind === "video" ? <Play className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {lightboxIdx !== null && media.length > 0 && (
          <Lightbox
            items={media.map((m: any) => ({ url: m.url, kind: m.kind, caption: m.caption }))}
            index={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onIndexChange={setLightboxIdx}
          />
        )}

        {/* Products */}
        <section className="mt-8 pb-16">

          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl">Créations</h2>
            <span className="text-sm text-slate-500">{listings.length} annonce{listings.length > 1 ? "s" : ""}</span>
          </div>
          {listings.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
              <Package className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-display text-lg">Aucune création publiée</p>
              <p className="mt-1 text-sm text-slate-500">Revenez bientôt pour découvrir les premières pièces.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l: any) => (
                <Link
                  key={l.id}
                  to="/annonces/$id"
                  params={{ id: l.id }}
                  className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-lg"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                    {l.cover_image_url && (
                      <img src={l.cover_image_url} alt={l.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    {l.is_premium && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">Premium</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-1 font-medium">{l.title}</p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-display text-lg text-emerald-700">{Number(l.price_xof).toLocaleString()} FCFA</span>
                      {l.city && <span className="text-xs text-slate-400">{l.city}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
