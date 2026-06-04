import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxItem = {
  url: string;
  kind: "image" | "video";
  caption?: string | null;
};

type Props = {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

export function Lightbox({ items, index, onClose, onIndexChange }: Props) {
  const safeIndex = ((index % items.length) + items.length) % items.length;
  const current = items[safeIndex];

  const prev = useCallback(
    () => onIndexChange((safeIndex - 1 + items.length) % items.length),
    [items.length, safeIndex, onIndexChange],
  );
  const next = useCallback(
    () => onIndexChange((safeIndex + 1) % items.length),
    [items.length, safeIndex, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [prev, next, onClose]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Fermer"
      >
        <X className="h-5 w-5" />
      </button>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Suivant"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative flex max-h-[90vh] max-w-6xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {current.kind === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg"
          />
        ) : (
          <img
            key={current.url}
            src={current.url}
            alt={current.caption ?? ""}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-white/80">
          <span>
            {safeIndex + 1} / {items.length}
          </span>
          {current.caption && <span className="truncate">{current.caption}</span>}
        </div>
      </div>
    </div>
  );
}
