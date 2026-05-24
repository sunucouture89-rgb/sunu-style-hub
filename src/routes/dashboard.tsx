import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { boostListing } from "@/lib/listings.functions";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Rocket,
  Plus,
  TrendingUp,
  Eye,
  Heart,
  Star,
  Crown,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ),
});

type Tab = "overview" | "listings" | "orders" | "payments" | "boost";

function DashboardPage() {
  const { user, roles, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("listings").select("*").eq("couturier_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setListings(data ?? []));
    supabase.from("orders").select("*").eq("couturier_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Chargement…</div>;
  }

  const revenue = orders.filter((o: any) => o.status === "paid" || o.status === "completed")
    .reduce((sum: number, o: any) => sum + (Number(o.amount_xof) || 0), 0);
  const pending = orders.filter((o: any) => o.status === "pending").length;
  const totalViews = listings.reduce((s: number, l: any) => s + (l.views_count ?? 0), 0);

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: "listings", label: "Annonces", icon: Package },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "payments", label: "Paiements", icon: Wallet },
    { id: "boost", label: "Boost Premium", icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 px-2">
              <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-900">← Retour au site</Link>
              <p className="mt-2 font-display text-lg">Espace Couturier</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((it) => {
                const active = tab === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => setTab(it.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <it.icon className="h-4 w-4" />
                    {it.label}
                  </button>
                );
              })}
            </nav>
            {!roles.includes("couturier") && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                Votre compte n'a pas encore le rôle couturier.
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-6">
          {/* Mobile tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {navItems.map((it) => (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  tab === it.id ? "bg-emerald-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <Overview revenue={revenue} pending={pending} totalViews={totalViews} listingsCount={listings.length} />
          )}
          {tab === "listings" && <Listings listings={listings} />}
          {tab === "orders" && <Orders orders={orders} />}
          {tab === "payments" && <Payments revenue={revenue} orders={orders} />}
          {tab === "boost" && <Boost listings={listings} />}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: any) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-full ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl text-slate-900">{value}</p>
    </div>
  );
}

function Overview({ revenue, pending, totalViews, listingsCount }: any) {
  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Bonjour 👋</h1>
          <p className="text-sm text-slate-500">Voici un aperçu de votre activité aujourd'hui.</p>
        </div>
        <Link to="/dashboard/listings/new" className="hidden items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 sm:flex">
          <Plus className="h-4 w-4" /> Nouvelle annonce
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenus" value={`${revenue.toLocaleString()} FCFA`} icon={Wallet} accent="bg-emerald-100 text-emerald-700" />
        <StatCard label="Commandes" value={pending} icon={ShoppingCart} accent="bg-amber-100 text-amber-700" />
        <StatCard label="Vues totales" value={totalViews} icon={Eye} accent="bg-sky-100 text-sky-700" />
        <StatCard label="Annonces" value={listingsCount} icon={Package} accent="bg-violet-100 text-violet-700" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Performance</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </span>
          </div>
          <div className="grid h-44 grid-cols-7 items-end gap-3">
            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-slate-400">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 p-6 shadow-sm ring-1 ring-amber-200">
          <Crown className="h-6 w-6 text-amber-600" />
          <h3 className="mt-3 font-display text-lg">Passez en Premium</h3>
          <p className="mt-1 text-sm text-slate-600">Boostez vos annonces et apparaissez en tête des recherches.</p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            <Sparkles className="h-4 w-4" /> Activer Premium
          </button>
        </div>
      </div>
    </>
  );
}

function Listings({ listings }: { listings: any[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl">Mes annonces</h2>
        <Link to="/dashboard/listings/new" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Nouvelle annonce
        </Link>
      </div>
      {listings.length === 0 ? (
        <Empty icon={Package} title="Aucune annonce" desc="Publiez votre première création pour attirer des clients." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-3">Annonce</th>
                <th className="py-3">Prix</th>
                <th className="py-3">Vues</th>
                <th className="py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium">{l.title}</td>
                  <td className="py-3">{Number(l.price ?? 0).toLocaleString()} FCFA</td>
                  <td className="py-3"><span className="inline-flex items-center gap-1 text-slate-600"><Eye className="h-3 w-3" /> {l.views ?? 0}</span></td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {l.status ?? "active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Orders({ orders }: { orders: any[] }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-5 font-display text-xl">Commandes</h2>
      {orders.length === 0 ? (
        <Empty icon={ShoppingCart} title="Aucune commande" desc="Les commandes de vos clients apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div>
                <p className="font-medium">Commande #{String(o.id).slice(0, 8)}</p>
                <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-display">{Number(o.amount ?? 0).toLocaleString()} FCFA</p>
                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Payments({ revenue, orders }: any) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Solde disponible" value={`${revenue.toLocaleString()} FCFA`} icon={Wallet} accent="bg-emerald-100 text-emerald-700" />
        <StatCard label="En attente" value="0 FCFA" icon={ShoppingCart} accent="bg-amber-100 text-amber-700" />
        <StatCard label="Retraits" value="0" icon={TrendingUp} accent="bg-sky-100 text-sky-700" />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Méthodes de paiement</h2>
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Demander un retrait
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Orange Money", "Wave", "Free Money"].map((m) => (
            <div key={m} className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 ring-1 ring-slate-200">
              <p className="text-sm font-medium">{m}</p>
              <p className="mt-1 text-xs text-slate-500">Configurer ce mode</p>
            </div>
          ))}
        </div>
        {orders.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-slate-500">Historique</h3>
            <ul className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((o: any) => (
                <li key={o.id} className="flex justify-between py-2 text-sm">
                  <span>#{String(o.id).slice(0, 8)}</span>
                  <span>{Number(o.amount_xof ?? 0).toLocaleString()} FCFA</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Boost({ listings }: { listings: any[] }) {
  const boost = useServerFn(boostListing);
  const [selected, setSelected] = useState<string>("");
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!selected && listings[0]) setSelected(listings[0].id);
  }, [listings, selected]);

  const plans = [
    { days: 1, price: 500, name: "Découverte", features: ["Boost 24 h", "Top de la grille", "Badge premium"], accent: "border-slate-200" },
    { days: 7, price: 2500, name: "Standard", features: ["Boost 7 jours", "Slider accueil", "Badge Vérifié"], accent: "border-slate-200" },
    { days: 30, price: 7500, name: "Premium", features: ["Boost 30 jours", "Slider accueil", "Badge doré", "Support prioritaire"], accent: "border-amber-400 ring-2 ring-amber-200", popular: true },
    { days: 90, price: 20000, name: "Élite", features: ["Boost 90 jours", "Toutes les options", "Page boutique"], accent: "border-emerald-300" },
  ];

  const onBoost = async (days: number) => {
    if (!selected) { toast.error("Choisissez une annonce"); return; }
    setBusy(days);
    try {
      const r = await boost({ data: { listingId: selected, durationDays: days, paymentMethod: "manual" } });
      toast.success(`Boost activé jusqu'au ${new Date(r.premium_until).toLocaleDateString("fr-FR")}`);
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 p-6 text-white shadow-sm">
        <Rocket className="h-7 w-7" />
        <h2 className="mt-3 font-display text-2xl">Boostez votre visibilité</h2>
        <p className="mt-1 text-sm text-white/90">Multipliez vos ventes en mettant vos créations en avant.</p>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 text-center text-sm text-slate-500">
          Publiez d'abord une annonce pour la booster.
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">Annonce à booster</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} {l.is_premium ? "★" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <div key={p.name} className={`relative rounded-2xl bg-white p-6 shadow-sm ring-1 ${p.accent}`}>
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow">
                <Star className="mr-1 inline h-3 w-3" /> Le plus choisi
              </span>
            )}
            <h3 className="font-display text-xl">{p.name}</h3>
            <p className="mt-2"><span className="font-display text-3xl">{p.price.toLocaleString()}</span> <span className="text-sm text-slate-500">FCFA</span></p>
            <p className="text-xs text-slate-500">pour {p.days} jour{p.days > 1 ? "s" : ""}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onBoost(p.days)}
              disabled={!selected || busy !== null}
              className={`mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition disabled:opacity-60 ${p.popular ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {busy === p.days ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Activer {p.name}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center">💡 Paiement actuellement en mode manuel — la boost est activée immédiatement pour validation. Brancher Stripe / Wave plus tard.</p>
    </div>
  );
}

function Empty({ icon: Icon, title, desc }: any) {
  return (
    <div className="grid place-items-center rounded-xl bg-slate-50 py-12 text-center">
      <Icon className="h-10 w-10 text-slate-300" />
      <p className="mt-3 font-display text-lg">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{desc}</p>
    </div>
  );
}
