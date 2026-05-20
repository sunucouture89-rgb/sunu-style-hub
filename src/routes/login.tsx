import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion — Sunu Couture" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Connecté !");
    navigate({ to: "/" });
  };

  const oauth = async (provider: "google" | "apple") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <main className="min-h-screen grid place-items-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="font-display text-2xl">
          Sunu <em className="gold-text not-italic">Couture</em>
        </Link>
        <h1 className="mt-6 font-display text-3xl">Bon retour</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connectez-vous pour commander, discuter et gérer vos créations.</p>

        <div className="mt-6 grid gap-2">
          <button onClick={() => oauth("google")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary">
            Continuer avec Google
          </button>
          <button onClick={() => oauth("apple")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary">
            Continuer avec Apple
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou avec votre email <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button disabled={loading} className="mt-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ? <Link to="/signup" className="font-medium text-foreground underline">Créer un compte</Link>
        </p>
      </div>
    </main>
  );
}
