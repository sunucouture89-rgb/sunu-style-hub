import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/messages")({
  component: () => (
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  ),
  head: () => ({ meta: [{ title: "Messages — Sunu Couture" }] }),
});

function MessagesPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="max-w-md text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-3xl">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vos conversations avec les clients et couturiers apparaîtront ici.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Retour à l'accueil</Link>
      </section>
    </main>
  );
}