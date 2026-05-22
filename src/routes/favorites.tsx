import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/favorites")({
  component: () => (
    <ProtectedRoute>
      <FavoritesPage />
    </ProtectedRoute>
  ),
  head: () => ({ meta: [{ title: "Favoris — Sunu Couture" }] }),
});

function FavoritesPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="max-w-md text-center">
        <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl">Favoris</h1>
        <p className="mt-2 text-sm text-muted-foreground">Les créations que vous aimez seront enregistrées ici.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Retour à l'accueil</Link>
      </section>
    </main>
  );
}