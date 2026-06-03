import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MediaManager } from "@/components/MediaManager";

export const Route = createFileRoute("/dashboard/listings/$id/media")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: ListingMediaPage,
  head: () => ({ meta: [{ title: "Médias de l'annonce — Sunu Couture" }] }),
});

function ListingMediaPage() {
  const { id } = Route.useParams();
  const [listing, setListing] = useState<{ title: string; cover_image_url: string | null } | null>(null);

  useEffect(() => {
    supabase
      .from("listings")
      .select("title, cover_image_url")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setListing(data));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="font-display text-xl text-slate-900 truncate max-w-[60%]">
            Médias · {listing?.title ?? "…"}
          </h1>
          <Link
            to="/annonces/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
          >
            Voir l'annonce <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <MediaManager listingId={id} />
        </div>
      </main>
    </div>
  );
}
