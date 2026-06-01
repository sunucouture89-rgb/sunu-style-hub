import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, ExternalLink, BadgeCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";

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
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("shops")
      .select("*")
      .eq("couturier_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setShop(data as Shop | null);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl bg-white p-12 ring-1 ring-slate-200">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 text-sm text-slate-600">
        Aucune boutique trouvée. Assurez-vous d'avoir le rôle couturier.
      </div>
    );
  }

  const update = (patch: Partial<Shop>) => setShop({ ...shop, ...patch });

  const onSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        name: shop.name,
        tagline: shop.tagline,
        description: shop.description,
        logo_url: shop.logo_url,
        cover_url: shop.cover_url,
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

      {/* Media */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <p className="mb-2 text-sm font-medium">Logo</p>
          <R2Uploader
            folder={`shops/${shop.id}/logo`}
            accept="image"
            multiple={false}
            maxFiles={1}
            value={logoAssets}
            onChange={(a) => update({ logo_url: a[0]?.publicUrl ?? null })}
          />
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <p className="mb-2 text-sm font-medium">Bannière</p>
          <R2Uploader
            folder={`shops/${shop.id}/cover`}
            accept="image"
            multiple={false}
            maxFiles={1}
            value={coverAssets}
            onChange={(a) => update({ cover_url: a[0]?.publicUrl ?? null })}
          />
        </div>
      </div>

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
          <textarea className={`${inp} min-h-[120px]`} value={shop.description ?? ""} onChange={(e) => update({ description: e.target.value })} maxLength={2000} placeholder="Parlez de votre savoir-faire, votre style, votre histoire…" />
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

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
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
