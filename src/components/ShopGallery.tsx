import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, ImagePlus, Loader2, Film, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";

type Media = {
  id: string;
  shop_id: string;
  url: string;
  r2_key: string | null;
  kind: "image" | "video";
  caption: string | null;
  position: number;
};

export function ShopGallery({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("shop_media")
      .select("*")
      .eq("shop_id", shopId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    setItems((data as Media[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [shopId]);

  const onUploaded = async (assets: R2Asset[]) => {
    if (!assets.length) return;
    const max = items.length
      ? Math.max(...items.map((i) => i.position)) + 1
      : 0;
    const rows = assets.map((a, idx) => ({
      shop_id: shopId,
      url: a.publicUrl,
      r2_key: a.key,
      kind: a.contentType.startsWith("video/") ? "video" : "image",
      position: max + idx,
    }));
    const { error } = await (supabase as any).from("shop_media").insert(rows);
    if (error) toast.error(error.message);
    else {
      toast.success(`${rows.length} média(s) ajouté(s) à la galerie`);
      setAdding(false);
      load();
    }
  };

  const remove = async (m: Media) => {
    if (!confirm("Supprimer ce média de votre galerie ?")) return;
    const { error } = await (supabase as any)
      .from("shop_media")
      .delete()
      .eq("id", m.id);
    if (error) toast.error(error.message);
    else {
      setItems((it) => it.filter((x) => x.id !== m.id));
      toast.success("Média supprimé");
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">Photos & vidéos de la boutique</h3>
          <p className="mt-1 text-xs text-slate-500">
            Galerie personnelle affichée sur votre profil public — idéal pour
            mettre en avant votre atelier, vos coulisses ou un défilé.
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <ImagePlus className="h-4 w-4" />
          {adding ? "Fermer" : "Ajouter des médias"}
        </button>
      </div>

      {adding && (
        <div className="mb-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <R2Uploader
            folder={`shops/${shopId}/gallery`}
            accept="any"
            multiple
            maxFiles={20}
            maxSizeMB={100}
            onChange={onUploaded}
            label="Glissez vos photos ou vidéos (Cloudflare R2)"
          />
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-600">
            Aucun média pour le moment. Cliquez sur{" "}
            <span className="font-medium text-emerald-700">
              « Ajouter des médias »
            </span>{" "}
            pour démarrer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
            >
              {m.kind === "video" ? (
                <video
                  src={m.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={m.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                {m.kind === "video" ? (
                  <>
                    <Film className="h-3 w-3" /> Vidéo
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3 w-3" /> Photo
                  </>
                )}
              </span>
              <button
                onClick={() => remove(m)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
