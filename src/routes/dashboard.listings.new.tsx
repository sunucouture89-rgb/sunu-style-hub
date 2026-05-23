import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";

export const Route = createFileRoute("/dashboard/listings/new")({
  component: NewListingPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Nouvelle annonce — Sunu Couture" }] }),
});

const CATEGORIES = [
  { value: "boubou-homme", label: "Boubou Homme" },
  { value: "boubou-femme", label: "Boubou Femme" },
  { value: "grand-boubou", label: "Grand Boubou" },
  { value: "robes-africaines", label: "Robes africaines" },
  { value: "mariage", label: "Mariage" },
  { value: "broderie", label: "Broderie" },
  { value: "enfants", label: "Enfants" },
  { value: "chaussures", label: "Chaussures" },
  { value: "accessoires", label: "Accessoires" },
  { value: "luxe", label: "Mode de luxe" },
];

const GENDERS = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "mixte", label: "Mixte" },
  { value: "enfant", label: "Enfant" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Sur mesure"];

const schema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().min(1, "Catégorie requise"),
  fabric: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  price_xof: z.number().int().min(500, "Prix minimum 500 FCFA").max(50_000_000),
  delivery_days: z.number().int().min(1).max(180),
  gender: z.string().optional(),
  stock: z.number().int().min(0).max(9999),
  whatsapp_number: z.string().trim().max(30).optional(),
  delivery_available: z.boolean(),
});

function NewListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [media, setMedia] = useState<R2Asset[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    fabric: "",
    city: "Dakar",
    price_xof: "",
    delivery_days: "14",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSize = (s: string) =>
    setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({
      ...form,
      price_xof: Number(form.price_xof),
      delivery_days: Number(form.delivery_days),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    const images = media.filter((m) => m.contentType.startsWith("image/"));
    if (images.length === 0) {
      toast.error("Ajoutez au moins une photo");
      return;
    }

    setSubmitting(true);
    try {
      const cover = images[0].publicUrl;
      const fullDescription = [
        parsed.data.description?.trim(),
        sizes.length ? `Tailles disponibles: ${sizes.join(", ")}` : null,
        media.filter((m) => m.contentType.startsWith("video/")).length
          ? `Vidéos: ${media.filter((m) => m.contentType.startsWith("video/")).map((v) => v.publicUrl).join(" ")}`
          : null,
      ].filter(Boolean).join("\n\n");

      const { data: listing, error } = await supabase
        .from("listings")
        .insert({
          couturier_id: user.id,
          title: parsed.data.title,
          description: fullDescription || null,
          category: parsed.data.category,
          fabric: parsed.data.fabric || null,
          city: parsed.data.city || null,
          price_xof: parsed.data.price_xof,
          delivery_days: parsed.data.delivery_days,
          cover_image_url: cover,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      const rows = images.map((img, i) => ({
        listing_id: listing.id,
        url: img.publicUrl,
        position: i,
      }));
      if (rows.length) {
        const { error: imgErr } = await supabase.from("listing_images").insert(rows);
        if (imgErr) throw imgErr;
      }

      toast.success("Annonce publiée !");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="font-display text-2xl text-slate-900">Nouvelle annonce</h1>
          <div className="w-24" />
        </div>
      </header>

      <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-1 font-display text-lg text-slate-900">Photos & vidéos</h2>
          <p className="mb-4 text-sm text-slate-500">La 1ʳᵉ image sera la couverture. Jusqu'à 10 photos et 3 vidéos.</p>
          <R2Uploader folder="listings" accept="any" multiple maxFiles={13} maxSizeMB={100} value={media} onChange={setMedia} />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <h2 className="font-display text-lg text-slate-900">Détails de l'annonce</h2>

          <Field label="Titre *">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex : Boubou brodé émeraude — édition Téranga"
              maxLength={120}
              className="input"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Présentez votre création, finitions, occasion…"
              className="input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Catégorie *">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input" required>
                <option value="">Sélectionner…</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Ville">
              <input value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={80} className="input" />
            </Field>
          </div>

          <Field label="Tissu / matière">
            <input
              value={form.fabric}
              onChange={(e) => set("fabric", e.target.value)}
              placeholder="Bazin riche, wax, soie, dentelle…"
              maxLength={120}
              className="input"
            />
          </Field>

          <Field label="Tailles disponibles">
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => {
                const active = sizes.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-emerald-500"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prix (FCFA) *">
              <input
                type="number"
                value={form.price_xof}
                onChange={(e) => set("price_xof", e.target.value)}
                placeholder="Ex : 45000"
                min={500}
                className="input"
                required
              />
            </Field>
            <Field label="Délai de confection (jours) *">
              <input
                type="number"
                value={form.delivery_days}
                onChange={(e) => set("delivery_days", e.target.value)}
                min={1}
                max={180}
                className="input"
                required
              />
            </Field>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            to="/dashboard"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Publier l'annonce
          </button>
        </div>
      </form>

      <style>{`.input{width:100%;border-radius:0.625rem;border:1px solid rgb(203 213 225);background:white;padding:0.625rem 0.875rem;font-size:0.875rem;color:rgb(15 23 42);outline:none;transition:border-color .15s,box-shadow .15s}.input:focus{border-color:rgb(16 185 129);box-shadow:0 0 0 3px rgb(16 185 129 / 0.15)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-600">{label}</span>
      {children}
    </label>
  );
}
