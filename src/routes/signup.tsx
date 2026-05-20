import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Créer un compte — Sunu Couture" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "couturier">("client");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    // If signed up couturier, also insert role explicitly (in case meta missed)
    if (data.user) {
      await supabase.from("user_roles").upsert({ user_id: data.user.id, role }, { onConflict: "user_id,role" });
    }
    setLoading(false);
    toast.success("Bienvenue ! Compte créé.");
    navigate({ to: role === "couturier" ? "/dashboard" : "/" });
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
        <h1 className="mt-6 font-display text-3xl">Rejoignez la maison</h1>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["client", "couturier"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                role === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary"
              }`}
            >
              {r === "client" ? "Je suis client" : "Je suis couturier"}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <button onClick={() => oauth("google")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary">
            S'inscrire avec Google
          </button>
          <button onClick={() => oauth("apple")} className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary">
            S'inscrire avec Apple
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe (6+ caractères)" className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm" />
          <button disabled={loading} className="mt-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ? <Link to="/login" className="font-medium text-foreground underline">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
