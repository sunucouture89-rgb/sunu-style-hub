import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import imageCompression from "browser-image-compression";
import { Upload, X, Image as ImageIcon, Film, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteR2Object } from "@/lib/r2.functions";
import { cn } from "@/lib/utils";

export type R2Asset = {
  key: string;
  publicUrl: string;
  contentType: string;
  name: string;
};

type Props = {
  folder?: string;
  accept?: "image" | "video" | "any";
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  value?: R2Asset[];
  onChange?: (assets: R2Asset[]) => void;
  className?: string;
  label?: string;
};

const ALLOWED_IMAGE = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];

const ACCEPT_MAP: Record<NonNullable<Props["accept"]>, string> = {
  image: ALLOWED_IMAGE.join(","),
  video: ALLOWED_VIDEO.join(","),
  any: [...ALLOWED_IMAGE, ...ALLOWED_VIDEO].join(","),
};

const MAX_RETRIES = 2;

function uploadWithProgress(
  file: File | Blob,
  folder: string,
  token: string,
  onProgress: (pct: number) => void,
): Promise<R2Asset> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    const filename = (file as File).name || "upload";
    form.append("folder", folder);
    form.append("file", file, filename);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/r2-upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () =>
      reject(new Error("Network error: could not reach /api/r2-upload (check your connection)"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.onload = () => {
      let payload: any = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.publicUrl) {
        resolve(payload as R2Asset);
      } else {
        const msg =
          payload?.error ||
          xhr.responseText ||
          `Upload failed (HTTP ${xhr.status} ${xhr.statusText})`;
        reject(new Error(msg));
      }
    };
    xhr.send(form);
  });
}

export function R2Uploader({
  folder = "uploads",
  accept = "image",
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 50,
  value,
  onChange,
  className,
  label = "Glissez vos fichiers ici ou cliquez pour parcourir",
}: Props) {
  const deleteObj = useServerFn(deleteR2Object);

  const [internal, setInternal] = useState<R2Asset[]>([]);
  const assets = value ?? internal;
  const setAssets = (next: R2Asset[]) => {
    if (!value) setInternal(next);
    onChange?.(next);
  };

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = useCallback(
    async (file: File): Promise<R2Asset | null> => {
      const isImage = file.type.startsWith("image/");
      const allowed = isImage ? ALLOWED_IMAGE : ALLOWED_VIDEO;
      if (!allowed.includes(file.type)) {
        toast.error(
          `${file.name}: format non supporté (${file.type || "inconnu"}). Acceptés : jpg, png, webp, mp4, mov, webm.`,
        );
        return null;
      }

      let toUpload: File | Blob = file;
      if (isImage && file.type !== "image/gif") {
        try {
          toUpload = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 2000,
            useWebWorker: true,
            fileType: file.type as any,
          });
        } catch (e) {
          console.warn("[R2Uploader] compression skipped:", e);
          toUpload = file;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Vous devez être connecté pour téléverser.");
        return null;
      }

      let lastErr: unknown;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const asset = await uploadWithProgress(toUpload, folder, token, (pct) =>
            setProgress((p) => ({ ...p, [file.name]: pct })),
          );
          return asset;
        } catch (err) {
          lastErr = err;
          console.error(`[R2Uploader] attempt ${attempt + 1} failed for ${file.name}:`, err);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        } finally {
          setProgress((p) => {
            const { [file.name]: _, ...rest } = p;
            return rest;
          });
        }
      }
      const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      toast.error(`${file.name}: ${msg}`);
      return null;
    },
    [folder],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const allowed = multiple ? arr.slice(0, maxFiles - assets.length) : arr.slice(0, 1);
      const valid = allowed.filter((f) => {
        if (f.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${f.name} dépasse ${maxSizeMB} Mo`);
          return false;
        }
        return true;
      });
      if (!valid.length) return;
      setUploading(true);
      const results = await Promise.all(valid.map(uploadOne));
      const ok = results.filter(Boolean) as R2Asset[];
      setAssets(multiple ? [...assets, ...ok] : ok);
      setUploading(false);
      if (ok.length) toast.success(`${ok.length} fichier(s) téléversé(s)`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, maxFiles, maxSizeMB, multiple, uploadOne],
  );

  const remove = async (asset: R2Asset) => {
    setAssets(assets.filter((a) => a.key !== asset.key));
    try {
      await deleteObj({ data: { key: asset.key } });
    } catch (e: any) {
      toast.error(`Suppression échouée: ${e.message ?? ""}`);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[accept]}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
        </div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {accept === "image" ? "jpg, png, webp" : accept === "video" ? "mp4, mov, webm" : "jpg, png, webp, mp4, mov, webm"} · max {maxSizeMB} Mo
          {multiple ? ` · jusqu'à ${maxFiles} fichiers` : ""}
        </p>
      </div>

      {Object.entries(progress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(progress).map(([name, pct]) => (
            <div key={name} className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate">{name}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {assets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset) => (
            <div
              key={asset.key}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {asset.contentType.startsWith("image/") ? (
                <img src={asset.publicUrl} alt={asset.name} className="h-full w-full object-cover" />
              ) : asset.contentType.startsWith("video/") ? (
                <video src={asset.publicUrl} className="h-full w-full object-cover" muted />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 text-[10px] text-white">
                {asset.contentType.startsWith("video/") ? (
                  <Film className="h-3 w-3" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
                <span className="truncate">{asset.name}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(asset);
                }}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100 hover:bg-destructive"
                aria-label="Supprimer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
