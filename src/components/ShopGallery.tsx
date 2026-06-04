import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Trash2,
  ImagePlus,
  Loader2,
  Film,
  Image as ImageIcon,
  GripVertical,
  Expand,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";
import { deleteR2Object } from "@/lib/r2.functions";
import { Lightbox } from "@/components/Lightbox";
import { cn } from "@/lib/utils";

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
  const deleteObj = useServerFn(deleteR2Object);
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

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
    const max = items.length ? Math.max(...items.map((i) => i.position)) + 1 : 0;
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

  const persistOrder = async (ordered: Media[]) => {
    await Promise.all(
      ordered.map((row, i) =>
        (supabase as any).from("shop_media").update({ position: i }).eq("id", row.id),
      ),
    );
  };

  const reorder = async (fromId: string, toId: string) => {
    const list = items.slice();
    const fromIdx = list.findIndex((x) => x.id === fromId);
    const toIdx = list.findIndex((x) => x.id === toId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setItems(list);
    await persistOrder(list);
  };

  const remove = async (m: Media) => {
    const label = m.kind === "video" ? "cette vidéo" : "cette photo";
    if (!confirm(`Supprimer ${label} de votre galerie ? L'action est irréversible.`)) return;
    const { error } = await (supabase as any).from("shop_media").delete().eq("id", m.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((it) => it.filter((x) => x.id !== m.id));
    if (m.r2_key) {
      try {
        await deleteObj({ data: { key: m.r2_key } });
      } catch (e: any) {
        toast.error(`Fichier R2 non supprimé: ${e?.message ?? "erreur"}`);
      }
    }
    toast.success("Média supprimé");
  };

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">Photos & vidéos de la boutique</h3>
          <p className="mt-1 text-xs text-slate-500">
            Glissez-déposez pour réordonner. Le premier média s'affiche en couverture de votre galerie publique.
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
            label="Glissez vos photos ou vidéos"
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
            <span className="font-medium text-emerald-700">« Ajouter des médias »</span> pour démarrer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m, i) => {
            const dragging = dragKey === m.id;
            return (
              <div
                key={m.id}
                draggable
                onDragStart={(e) => {
                  setDragKey(m.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", m.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const src = e.dataTransfer.getData("text/plain") || dragKey;
                  if (src && src !== m.id) reorder(src, m.id);
                  setDragKey(null);
                }}
                onDragEnd={() => setDragKey(null)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 transition",
                  dragging && "opacity-50 ring-2 ring-emerald-400",
                )}
              >
                {m.kind === "video" ? (
                  <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" draggable={false} />
                )}

                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {m.kind === "video" ? (
                    <><Film className="h-3 w-3" /> Vidéo</>
                  ) : (
                    <><ImageIcon className="h-3 w-3" /> Photo</>
                  )}
                </span>

                <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-white opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="h-3 w-3" /> glisser
                </span>

                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => setLightboxIdx(i)}
                    title="Aperçu plein écran"
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:bg-white"
                  >
                    <Expand className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(m)}
                    title="Supprimer"
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-red-600 shadow-sm hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightboxIdx !== null && items.length > 0 && (
        <Lightbox
          items={items.map((m) => ({ url: m.url, kind: m.kind, caption: m.caption }))}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onIndexChange={setLightboxIdx}
        />
      )}
    </div>
  );
}
