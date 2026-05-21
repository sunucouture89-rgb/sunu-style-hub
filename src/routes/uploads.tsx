import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { R2Uploader, type R2Asset } from "@/components/R2Uploader";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/uploads")({
  component: UploadsPage,
  head: () => ({
    meta: [{ title: "Téléversements — Sunu Couture" }],
  }),
});

function UploadsPage() {
  const [gallery, setGallery] = useState<R2Asset[]>([]);
  const [avatar, setAvatar] = useState<R2Asset[]>([]);
  const [videos, setVideos] = useState<R2Asset[]>([]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="font-display text-2xl">Médias — Cloudflare R2</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <section>
          <h2 className="mb-1 font-display text-xl">Photo de profil atelier</h2>
          <p className="mb-4 text-sm text-muted-foreground">Une seule image, compressée automatiquement.</p>
          <R2Uploader
            folder="avatars"
            accept="image"
            multiple={false}
            maxFiles={1}
            maxSizeMB={10}
            value={avatar}
            onChange={setAvatar}
            label="Téléversez votre photo de profil"
          />
        </section>

        <section>
          <h2 className="mb-1 font-display text-xl">Galerie produit</h2>
          <p className="mb-4 text-sm text-muted-foreground">Jusqu'à 10 images par création. Glissez-déposez plusieurs fichiers.</p>
          <R2Uploader
            folder="listings"
            accept="image"
            multiple
            maxFiles={10}
            maxSizeMB={15}
            value={gallery}
            onChange={setGallery}
          />
        </section>

        <section>
          <h2 className="mb-1 font-display text-xl">Vidéos de présentation</h2>
          <p className="mb-4 text-sm text-muted-foreground">Vidéos courtes pour mettre en valeur vos créations.</p>
          <R2Uploader
            folder="videos"
            accept="video"
            multiple
            maxFiles={5}
            maxSizeMB={100}
            value={videos}
            onChange={setVideos}
            label="Glissez vos vidéos ici"
          />
        </section>
      </main>
    </div>
  );
}
