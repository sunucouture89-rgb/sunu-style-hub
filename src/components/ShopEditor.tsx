import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, ExternalLink, BadgeCheck, Sparkles, Wand2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";
import { ShopGallery } from "@/components/ShopGallery";
import { useAuth } from "@/hooks/use-auth";
import { generateShopDescription } from "@/lib/ai.functions";


type Shop = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  website: string | null;
  is_verified: boolean;
  is_active: boolean;
  followers_count: number;
};

export function ShopEditor({ userId }: { userId: string }) {
  const { refreshRoles } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [becoming, setBecoming] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiKeywords, setAiKeywords] = useState("");
  const genDesc = useServerFn(generateShopDescription);

  const load = async () => {

    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("couturier_id", userId)
      .maybeSingle();
    setShop(data as Shop | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const becomeCouturier = async () => {
    setBecoming(true);
    const { error } = await (supabase as any).rpc("become_couturier", { _display_name: null });
    setBecoming(false);
    if (error) return toast.error(error.message);
    toast.success("Bienvenue ! Votre boutique a été créée.");
    await refreshRoles();
    await load();
  };

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl bg-white p-12 ring-1 ring-slate-200">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-amber-50 p-8 ring-1 ring-emerald-200">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white">
            <Sparkles className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-2xl text-slate-900">
            Activez votre boutique en un clic
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Votre compte n'a pas encore le rôle <strong>couturier</strong>.
            Cliquez ci-dessous pour devenir couturier : votre boutique{" "}
            <em>Ma boutique</em> apparaîtra immédiatement et vous pourrez
            uploader logo, bannière, photos et vidéos.
          </p>
          <button
            onClick={becomeCouturier}
            disabled={becoming}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {becoming ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
            Devenir couturier — créer ma boutique
          </button>
        </div>
      </div>
    );
  }

  const update = (patch: Partial<Shop>) => setShop({ ...shop, ...patch });

  const saveMedia = async (patch: Partial<Shop>) => {
    setSavingMedia(true);
    const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
    setSavingMedia(false);
    if (error) toast.error(error.message);
    else {
      setShop({ ...shop, ...patch });
      toast.success("Photo enregistrée");
    }
  };

  const onSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: shop.name,
        tagline: shop.tagline,
        description: shop.description,
        whatsapp: shop.whatsapp,
        phone: shop.phone,
        email: shop.email,
        city: shop.city,
        country: shop.country,
        address: shop.address,
        instagram: shop.instagram,
        tiktok: shop.tiktok,
        facebook: shop.facebook,
        website: shop.website,
      })
      .eq("id", shop.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Boutique mise à jour");
  };

  const logoAssets: R2Asset[] = shop.logo_url
    ? [{ key: shop.logo_url, publicUrl: shop.logo_url, contentType: "image/*", name: "logo" }]
    : [];
  const coverAssets: R2Asset[] = shop.cover_url
    ? [{ key: shop.cover_url, publicUrl: shop.cover_url, contentType: "image/*", name: "cover" }]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 to-amber-500 p-5 text-white shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wider opacity-90">Votre boutique publique</p>
          <p className="font-display text-xl">
            sunucouture.com/shop/{shop.slug}{" "}
            {shop.is_verified && <BadgeCheck className="inline h-4 w-4" />}
          </p>
        </div>
        <Link
          to="/shop/$slug"
          params={{ slug: shop.slug }}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
        >
          <ExternalLink className="h-4 w-4" /> Voir
        </Link>
      </div>

      {/* PROFILE PHOTO (logo) */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">Photo de profil (logo)</h3>
            <p className="text-xs text-slate-500">Format carré recommandé · 500×500 px</p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
          <div className="aspect-square w-40 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt="Aperçu logo" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-display text-slate-300">
                {shop.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <R2Uploader
              folder={`shops/${shop.id}/logo`}
              accept="image"
              multiple={false}
              maxFiles={1}
              value={logoAssets}
              onChange={(a) => update({ logo_url: a[0]?.publicUrl ?? null })}
              label="Glissez votre logo ici"
            />
            <button
              onClick={() => saveMedia({ logo_url: shop.logo_url })}
              disabled={savingMedia}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer le logo
            </button>
          </div>
        </div>
      </div>

      {/* BANNER (cover) */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <div className="mb-4">
          <h3 className="font-display text-lg">Bannière de la boutique</h3>
          <p className="text-xs text-slate-500">Image large · 1600×600 px recommandé</p>
        </div>
        <div className="mb-4 aspect-[16/6] w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 ring-1 ring-slate-200">
          {shop.cover_url && (
            <img src={shop.cover_url} alt="Aperçu bannière" className="h-full w-full object-cover" />
          )}
        </div>
        <R2Uploader
          folder={`shops/${shop.id}/cover`}
          accept="image"
          multiple={false}
          maxFiles={1}
          value={coverAssets}
          onChange={(a) => update({ cover_url: a[0]?.publicUrl ?? null })}
          label="Glissez votre bannière ici"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => saveMedia({ cover_url: shop.cover_url })}
            disabled={savingMedia}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {savingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer la bannière
          </button>
        </div>
      </div>

      {/* GALLERY — photos & videos */}
      <ShopGallery shopId={shop.id} />

      {/* Identity */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-4">
        <h3 className="font-display text-lg">Identité</h3>
        <Field label="Nom de la boutique">
          <input className={inp} value={shop.name} onChange={(e) => update({ name: e.target.value })} />
        </Field>
        <Field label="Slogan court">
          <input className={inp} value={shop.tagline ?? ""} onChange={(e) => update({ tagline: e.target.value })} maxLength={120} placeholder="Couture sur-mesure haut de gamme" />
        </Field>
        <Field label="Description">
          <div className="space-y-2">
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-emerald-50 p-3 ring-1 ring-violet-100">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-800">
                <Wand2 className="h-3.5 w-3.5" /> Assistant IA — rédigez en 1 clic
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  className={`${inp} flex-1`}
                  placeholder="Mots-clés (ex: bazin riche, mariage, sur-mesure Dakar)"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                />
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={async () => {
                    setAiBusy(true);
                    try {
                      const r = await genDesc({
                        data: {
                          name: shop.name,
                          tagline: shop.tagline ?? "",
                          city: shop.city ?? "",
                          country: shop.country ?? "",
                          current: shop.description ?? "",
                          keywords: aiKeywords,
                        },
                      });
                      update({ description: r.description });
                      toast.success("Description générée — pensez à enregistrer");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Erreur IA");
                    } finally {
                      setAiBusy(false);
                    }
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                >
                  {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {shop.description ? "Améliorer" : "Générer"}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">
                L'IA s'appuie sur votre nom, slogan, ville et mots-clés pour rédiger une description soignée.
              </p>
            </div>
            <textarea
              className={`${inp} min-h-[120px]`}
              value={shop.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              maxLength={2000}
              placeholder="Parlez de votre savoir-faire, votre style, votre histoire…"
            />
            <div className="text-right text-[10px] text-slate-400">
              {(shop.description ?? "").length}/2000
            </div>
          </div>
        </Field>
      </div>


      {/* Contact */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-4">
        <h3 className="font-display text-lg">Contact & localisation</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp (+221…)"><input className={inp} value={shop.whatsapp ?? ""} onChange={(e) => update({ whatsapp: e.target.value })} placeholder="+221 77 000 00 00" /></Field>
          <Field label="Téléphone"><input className={inp} value={shop.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></Field>
          <Field label="Email"><input className={inp} type="email" value={shop.email ?? ""} onChange={(e) => update({ email: e.target.value })} /></Field>
          <Field label="Ville"><input className={inp} value={shop.city ?? ""} onChange={(e) => update({ city: e.target.value })} placeholder="Dakar" /></Field>
          <Field label="Pays"><input className={inp} value={shop.country ?? ""} onChange={(e) => update({ country: e.target.value })} /></Field>
          <Field label="Adresse"><input className={inp} value={shop.address ?? ""} onChange={(e) => update({ address: e.target.value })} /></Field>
        </div>
      </div>

      {/* Socials */}
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-4">
        <h3 className="font-display text-lg">Réseaux sociaux</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram"><input className={inp} value={shop.instagram ?? ""} onChange={(e) => update({ instagram: e.target.value })} placeholder="https://instagram.com/…" /></Field>
          <Field label="TikTok"><input className={inp} value={shop.tiktok ?? ""} onChange={(e) => update({ tiktok: e.target.value })} placeholder="https://tiktok.com/@…" /></Field>
          <Field label="Facebook"><input className={inp} value={shop.facebook ?? ""} onChange={(e) => update({ facebook: e.target.value })} /></Field>
          <Field label="Site web"><input className={inp} value={shop.website ?? ""} onChange={(e) => update({ website: e.target.value })} placeholder="https://" /></Field>
        </div>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-luxe hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer toutes les infos
        </button>
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}
