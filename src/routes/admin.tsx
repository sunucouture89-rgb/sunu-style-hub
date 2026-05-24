import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Sparkles, Trash2, X, Check, Crown, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { listAdminQueue, moderateListing } from "@/lib/listings.functions";
import { Navbar } from "@/components/landing/Navbar";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Admin — Sunu Couture" }, { name: "robots", content: "noindex" }] }),
});

function AdminPage() {
  const { roles, loading } = useAuth();
  const fetchQueue = useServerFn(listAdminQueue);
  const moderate = useServerFn(moderateListing);
  const qc = useQueryClient();
  const [rejectFor, setRejectFor] = useState<{ id: string; title: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-queue"],
    queryFn: () => fetchQueue(),
    enabled: !loading && roles.includes("admin"),
    retry: false,
  });

  if (loading) return <Splash text="Chargement…" />;
  if (!roles.includes("admin")) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 px-6 max-w-2xl mx-auto text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 font-display text-3xl">Accès réservé</h1>
          <p className="mt-2 text-foreground/70">Cette zone est réservée aux administrateurs.</p>
          <Link to="/" className="mt-6 inline-block text-primary underline">← Retour à l'accueil</Link>
        </div>
      </main>
    );
  }

  const act = async (id: string, action: "approve" | "reject" | "feature" | "delete", reason?: string) => {
    setBusy(id + action);
    try {
      await moderate({ data: { listingId: id, action, reason } });
      toast.success("Action effectuée");
      qc.invalidateQueries({ queryKey: ["admin-queue"] });
      setRejectFor(null);
      setReason("");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <Splash text="Chargement de la file…" />;
  if (error) return <Splash text={(error as Error).message} />;

  const pending = data?.pending ?? [];
  const recent = data?.recent ?? [];
  const tx = data?.transactions ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-16 space-y-8">
        <header>
          <h1 className="font-display text-4xl">Modération</h1>
          <p className="mt-1 text-sm text-slate-500">Approuvez, refusez ou mettez en avant les annonces du marketplace.</p>
        </header>

        <Stats pending={pending.length} active={recent.filter((r: any) => r.status === "active").length} premium={recent.filter((r: any) => r.is_premium).length} revenue={tx.reduce((s: number, t: any) => s + (t.amount_xof || 0), 0)} />

        {/* Pending queue */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display text-xl mb-4">File d'attente ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Aucune annonce en attente. ✨</p>
          ) : (
            <div className="space-y-3">
              {pending.map((l: any) => (
                <div key={l.id} className="flex gap-4 rounded-xl ring-1 ring-slate-200 p-4">
                  <div className="h-24 w-24 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                    {l.cover_image_url && <img src={l.cover_image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.category} · {Number(l.price_xof).toLocaleString()} FCFA · {l.city ?? "—"}</p>
                    {l.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{l.description}</p>}
                    {l.ai_spam_score != null && (
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${Number(l.ai_spam_score) > 60 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        IA : score spam {Math.round(Number(l.ai_spam_score))}/100
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => act(l.id, "approve")} disabled={!!busy} className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                      <Check className="h-3 w-3" /> Approuver
                    </button>
                    <button onClick={() => setRejectFor({ id: l.id, title: l.title })} disabled={!!busy} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
                      <X className="h-3 w-3" /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display text-xl mb-4">Annonces récentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2">Titre</th>
                  <th>Statut</th>
                  <th>Premium</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l: any) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="py-2"><Link to="/annonces/$id" params={{ id: l.id }} className="hover:underline">{l.title}</Link></td>
                    <td><Badge status={l.status} /></td>
                    <td>{l.is_premium ? <span className="inline-flex items-center gap-1 text-amber-600"><Crown className="h-3 w-3" /> Oui</span> : "—"}</td>
                    <td className="text-right space-x-1">
                      <button onClick={() => act(l.id, "feature")} disabled={!!busy} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800 hover:bg-amber-200">
                        ★ Mettre en avant
                      </button>
                      <button onClick={() => { if (confirm("Supprimer cette annonce ?")) act(l.id, "delete"); }} disabled={!!busy} className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700 hover:bg-red-200">
                        <Trash2 className="inline h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Transactions */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-display text-xl mb-4">Transactions premium</h2>
          {tx.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Aucune transaction pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {tx.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <span>{new Date(t.created_at).toLocaleDateString("fr-FR")} · {t.duration_days}j · {t.payment_method}</span>
                  <span className="font-medium">{Number(t.amount_xof).toLocaleString()} FCFA</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Reject modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl">Refuser l'annonce</h3>
            <p className="mt-1 text-sm text-slate-600">« {rejectFor.title} »</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Raison du refus (sera envoyée au couturier)…"
              className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setRejectFor(null); setReason(""); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Annuler</button>
              <button onClick={() => act(rejectFor.id, "reject", reason)} disabled={!!busy} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm text-white">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stats({ pending, active, premium, revenue }: { pending: number; active: number; premium: number; revenue: number }) {
  const items = [
    { label: "En attente", value: pending, icon: ShieldCheck, accent: "bg-amber-100 text-amber-700" },
    { label: "Actives (récentes)", value: active, icon: Check, accent: "bg-emerald-100 text-emerald-700" },
    { label: "Premium actifs", value: premium, icon: Sparkles, accent: "bg-violet-100 text-violet-700" },
    { label: "Revenus premium", value: `${revenue.toLocaleString()} FCFA`, icon: Wallet, accent: "bg-sky-100 text-sky-700" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{it.label}</p>
            <span className={`grid h-9 w-9 place-items-center rounded-full ${it.accent}`}>
              <it.icon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    sold: "bg-slate-200 text-slate-700",
    draft: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

function Splash({ text }: { text: string }) {
  return <main className="grid min-h-screen place-items-center text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {text}</span></main>;
}
