import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, RefreshCw, ArrowLeft, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Failure = {
  id: string;
  user_id: string | null;
  folder: string | null;
  file_name: string | null;
  file_size: number | null;
  content_type: string | null;
  status_code: number | null;
  error: string | null;
  request_id: string | null;
  user_agent: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/uploads")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: UploadFailuresPage,
  head: () => ({ meta: [{ title: "Uploads échoués — Admin" }, { name: "robots", content: "noindex" }] }),
});

function UploadFailuresPage() {
  const { roles, loading } = useAuth();
  const [rows, setRows] = useState<Failure[]>([]);
  const [fetching, setFetching] = useState(true);
  const [diag, setDiag] = useState<any>(null);
  const [diagBusy, setDiagBusy] = useState(false);
  const [retryBusyId, setRetryBusyId] = useState<string | null>(null);

  const retryFailure = async (failureId: string) => {
    setRetryBusyId(failureId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/r2-retry", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ failureId }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        toast.error(
          body.r2Error
            ? `R2 indisponible : ${body.r2Error}`
            : (body.error ?? "Réessai impossible"),
        );
      } else {
        toast.success(
          body.notified
            ? "Utilisateur notifié, échec retiré de la file."
            : "R2 OK, échec retiré (utilisateur introuvable).",
        );
        setRows((prev) => prev.filter((r) => r.id !== failureId));
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur réseau");
    } finally {
      setRetryBusyId(null);
    }
  };

  const load = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("upload_failures" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setRows((data as any) ?? []);
    setFetching(false);
  };

  useEffect(() => {
    if (!loading && roles.includes("admin")) load();
  }, [loading, roles]);

  const runDiagnostic = async () => {
    setDiagBusy(true);
    setDiag(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/r2-diagnostic", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      setDiag(body);
      if (body.ok) toast.success("Cloudflare R2 : tout est OK");
      else toast.error("Diagnostic R2 : problème détecté");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur diagnostic");
    } finally {
      setDiagBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    );
  }
  if (!roles.includes("admin")) {
    return (
      <main className="grid min-h-screen place-items-center text-center text-slate-600">
        <div>
          <ShieldCheck className="mx-auto h-12 w-12 text-amber-500" />
          <p className="mt-3 font-display text-xl">Réservé aux administrateurs</p>
          <Link to="/" className="mt-4 inline-block text-emerald-600 underline">← Accueil</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <h1 className="font-display text-xl">Uploads échoués</h1>
          <div className="flex gap-2">
            <button
              onClick={runDiagnostic}
              disabled={diagBusy}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-3 py-1.5 text-xs text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {diagBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
              Diagnostic R2
            </button>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Rafraîchir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {diag && (
          <section
            className={`rounded-2xl p-5 ring-1 ${
              diag.ok ? "bg-emerald-50 ring-emerald-200" : "bg-red-50 ring-red-200"
            }`}
          >
            <h2 className="font-display text-lg">
              Diagnostic Cloudflare R2 — {diag.ok ? "OK" : "Problème"}
            </h2>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <li><strong>Bucket:</strong> {diag.bucket ?? "—"}</li>
              <li><strong>Endpoint:</strong> {diag.endpoint ?? "—"}</li>
              <li><strong>Public URL:</strong> {diag.publicUrl ?? "—"}</li>
              <li><strong>Variables manquantes:</strong> {diag.missing?.length ? diag.missing.join(", ") : "aucune"}</li>
              <li>
                <strong>HeadBucket:</strong>{" "}
                {diag.headBucket?.ok ? "✅ OK" : `❌ ${diag.headBucket?.error ?? "échec"}`}
              </li>
              <li>
                <strong>Write probe:</strong>{" "}
                {diag.writeProbe?.ok ? "✅ OK" : `❌ ${diag.writeProbe?.error ?? "échec"}`}
              </li>
              <li>
                <strong>Delete probe:</strong>{" "}
                {diag.deleteProbe?.ok ? "✅ OK" : `❌ ${diag.deleteProbe?.error ?? "non testé"}`}
              </li>
            </ul>
          </section>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-display text-lg">
            Échecs récents ({rows.length})
          </h2>
          {fetching ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : rows.length === 0 ? (
            <p className="rounded-lg bg-emerald-50 p-6 text-center text-sm text-emerald-700">
              Aucun upload échoué récemment. ✨
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-3">Quand</th>
                    <th className="pr-3">Utilisateur</th>
                    <th className="pr-3">Fichier</th>
                    <th className="pr-3">Type</th>
                    <th className="pr-3">Taille</th>
                    <th className="pr-3">HTTP</th>
                    <th className="pr-3">Raison</th>
                    <th className="pr-3">Req</th>
                    <th className="pr-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-3 text-slate-500">
                        {new Date(r.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="pr-3 font-mono text-[11px]">
                        {r.user_id ? r.user_id.slice(0, 8) : "—"}
                      </td>
                      <td className="pr-3 max-w-[200px] truncate" title={r.file_name ?? ""}>
                        {r.file_name ?? "—"}
                        {r.folder && <span className="block text-[10px] text-slate-400">{r.folder}</span>}
                      </td>
                      <td className="pr-3 text-slate-500">{r.content_type ?? "—"}</td>
                      <td className="pr-3 text-slate-500">
                        {r.file_size ? `${(r.file_size / 1024 / 1024).toFixed(2)} Mo` : "—"}
                      </td>
                      <td className="pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            (r.status_code ?? 0) >= 500
                              ? "bg-red-100 text-red-700"
                              : (r.status_code ?? 0) >= 400
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.status_code ?? "—"}
                        </span>
                      </td>
                      <td className="pr-3 max-w-[320px] text-red-700">{r.error ?? "—"}</td>
                      <td className="pr-3 font-mono text-[10px] text-slate-400">
                        {r.request_id ? r.request_id.slice(0, 8) : "—"}
                      </td>
                      <td className="pr-3 text-right">
                        <button
                          onClick={() => retryFailure(r.id)}
                          disabled={retryBusyId === r.id}
                          title="Vérifie R2 et notifie l'utilisateur de renvoyer son fichier"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {retryBusyId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Réessayer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
