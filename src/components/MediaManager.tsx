import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Star, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";
import { deleteR2Object } from "@/lib/r2.functions";
import { cn } from "@/lib/utils";

type MediaRow = {
  id: string;
  url: string;
  position: number;
  kind: "image" | "video";
};

function r2KeyFromUrl(url: string): string | null {
  const base = (import.meta as any).env?.VITE_R2_PUBLIC_URL as string | undefined;
  if (base && url.startsWith(base)) return url.slice(base.replace(/\/+$/, "").length + 1);
  // fallback: take everything after the host
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

export function MediaManager({ listingId }: { listingId: string }) {
  const deleteObj = useServerFn(deleteR2Object);
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCover, setSavingCover] = useState(false);

  const load = async () => {
    setLoading(true);
    const [imgs, vids] = await Promise.all([
      supabase.from("listing_images").select("id, url, position").eq("listing_id", listingId).order("position"),
      (supabase as any).from("ad_videos").select("id, url, position").eq("listing_id", listingId).order("position"),
    ]);
    const rows: MediaRow[] = [
      ...(imgs.data ?? []).map((r: any) => ({ ...r, kind: "image" as const })),
      ...(vids.data ?? []).map((r: any) => ({ ...r, kind: "video" as const })),
    ];
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [listingId]);

  const images = items.filter((i) => i.kind === "image").sort((a, b) => a.position - b.position);
  const videos = items.filter((i) => i.kind === "video").sort((a, b) => a.position - b.position);

  const persistOrder = async (kind: "image" | "video", ordered: MediaRow[]) => {
    const table = kind === "image" ? "listing_images" : "ad_videos";
    await Promise.all(
      ordered.map((row, i) =>
        (supabase as any).from(table).update({ position: i }).eq("id", row.id),
      ),
    );
  };

  const move = async (row: MediaRow, dir: -1 | 1) => {
    const list = (row.kind === "image" ? images : videos).slice();
    const idx = list.findIndex((x) => x.id === row.id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    setItems((prev) => [...prev.filter((x) => x.kind !== row.kind), ...list]);
    await persistOrder(row.kind, list);
    if (row.kind === "image" && (idx === 0 || swap === 0)) {
      await supabase.from("listings").update({ cover_image_url: list[0].url }).eq("id", listingId);
    }
  };

  const setAsCover = async (row: MediaRow) => {
    if (row.kind !== "image") return;
    setSavingCover(true);
    try {
      const list = [row, ...images.filter((x) => x.id !== row.id)];
      setItems((prev) => [...prev.filter((x) => x.kind !== "image"), ...list]);
      await persistOrder("image", list);
      await supabase.from("listings").update({ cover_image_url: row.url }).eq("id", listingId);
      toast.success("Couverture mise à jour");
    } finally {
      setSavingCover(false);
    }
  };

  const remove = async (row: MediaRow) => {
    if (!confirm("Supprimer ce média ?")) return;
    const table = row.kind === "image" ? "listing_images" : "ad_videos";
    const { error } = await (supabase as any).from(table).delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== row.id));
    const key = r2KeyFromUrl(row.url);
    if (key) {
      try {
        await deleteObj({ data: { key } });
      } catch {
        /* non-bloquant */
      }
    }
    if (row.kind === "image") {
      const remaining = images.filter((x) => x.id !== row.id);
      const newCover = remaining[0]?.url ?? null;
      await supabase.from("listings").update({ cover_image_url: newCover }).eq("id", listingId);
    }
    toast.success("Média supprimé");
  };

  const onUpload = async (assets: R2Asset[]) => {
    if (!assets.length) return;
    const imgs = assets.filter((a) => a.contentType.startsWith("image/"));
    const vids = assets.filter((a) => a.contentType.startsWith("video/"));
    const baseImgPos = images.length;
    const baseVidPos = videos.length;
    if (imgs.length) {
      const rows = imgs.map((a, i) => ({ listing_id: listingId, url: a.publicUrl, position: baseImgPos + i }));
      const { error } = await supabase.from("listing_images").insert(rows);
      if (error) toast.error(error.message);
    }
    if (vids.length) {
      const rows = vids.map((a, i) => ({ listing_id: listingId, url: a.publicUrl, position: baseVidPos + i }));
      const { error } = await (supabase as any).from("ad_videos").insert(rows);
      if (error) toast.error(error.message);
    }
    if (images.length === 0 && imgs.length) {
      await supabase.from("listings").update({ cover_image_url: imgs[0].publicUrl }).eq("id", listingId);
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-display text-lg">Ajouter des médias</h3>
        <R2Uploader
          folder={`listings/${listingId}`}
          accept="any"
          multiple
          maxFiles={13}
          maxSizeMB={100}
          value={[]}
          onChange={onUpload}
          label="Glissez vos photos et vidéos"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          <Section
            title={`Photos (${images.length})`}
            icon={<ImageIcon className="h-4 w-4" />}
            empty="Aucune photo. La première sera la couverture."
            items={images}
            renderItem={(row, idx) => (
              <Card
                key={row.id}
                row={row}
                isCover={idx === 0}
                onCover={() => setAsCover(row)}
                onUp={() => move(row, -1)}
                onDown={() => move(row, 1)}
                onDelete={() => remove(row)}
                disableUp={idx === 0}
                disableDown={idx === images.length - 1}
                savingCover={savingCover}
              />
            )}
          />

          <Section
            title={`Vidéos (${videos.length})`}
            icon={<Film className="h-4 w-4" />}
            empty="Aucune vidéo."
            items={videos}
            renderItem={(row, idx) => (
              <Card
                key={row.id}
                row={row}
                onUp={() => move(row, -1)}
                onDown={() => move(row, 1)}
                onDelete={() => remove(row)}
                disableUp={idx === 0}
                disableDown={idx === videos.length - 1}
              />
            )}
          />
        </>
      )}
    </div>
  );
}

function Section({
  title, icon, empty, items, renderItem,
}: { title: string; icon: React.ReactNode; empty: string; items: MediaRow[]; renderItem: (row: MediaRow, idx: number) => React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-display text-base">{icon} {title}</h3>
      {items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

function Card({
  row, isCover, onCover, onUp, onDown, onDelete, disableUp, disableDown, savingCover,
}: {
  row: MediaRow;
  isCover?: boolean;
  onCover?: () => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
  savingCover?: boolean;
}) {
  return (
    <div className={cn("group relative aspect-square overflow-hidden rounded-xl border bg-slate-100", isCover ? "border-amber-400 ring-2 ring-amber-200" : "border-slate-200")}>
      {row.kind === "image" ? (
        <img src={row.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <video src={row.url} className="h-full w-full object-cover" controls muted />
      )}

      {isCover && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          <Star className="h-3 w-3" /> Couverture
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
        <div className="flex gap-1">
          <IconBtn title="Monter" disabled={disableUp} onClick={onUp}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Descendre" disabled={disableDown} onClick={onDown}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
        </div>
        <div className="flex gap-1">
          {onCover && !isCover && (
            <IconBtn title="Définir comme couverture" onClick={onCover} disabled={savingCover}>
              <Star className="h-3.5 w-3.5" />
            </IconBtn>
          )}
          <IconBtn title="Supprimer" onClick={onDelete} danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:bg-white disabled:opacity-40",
        danger && "hover:bg-red-600 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
