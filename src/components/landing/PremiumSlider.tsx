import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PremiumSlider() {
  const { data = [] } = useQuery({
    queryKey: ["premium-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, cover_image_url, price_xof, city, category")
        .eq("status", "active")
        .eq("is_premium", true)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  if (data.length === 0) return null;

  return (
    <section className="px-6 py-16 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-3 py-1 text-xs font-semibold text-black">
              <Sparkles className="h-3.5 w-3.5" /> Premium
            </span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">Les créations en vedette</h2>
            <p className="mt-1 text-sm text-foreground/70">Annonces mises en avant par leurs couturiers.</p>
          </div>
          <Link to="/annonces" className="hidden md:inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Tout voir <ChevronRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6">
          {data.map((l: any) => (
            <Link
              key={l.id}
              to="/annonces/$id"
              params={{ id: l.id }}
              className="group relative shrink-0 w-[260px] md:w-[300px] snap-start overflow-hidden rounded-2xl ring-1 ring-amber-300/40 shadow-[0_0_30px_-10px_rgba(245,158,11,0.4)] transition hover:-translate-y-1"
            >
              <div className="aspect-[4/5] bg-muted">
                {l.cover_image_url && (
                  <img src={l.cover_image_url} alt={l.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
              </div>
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-2.5 py-1 text-[10px] font-bold text-black">
                <Sparkles className="h-3 w-3" /> Sponsorisé
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                <p className="font-medium truncate">{l.title}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="opacity-80">{l.city ?? l.category}</span>
                  <span className="font-semibold">{Number(l.price_xof).toLocaleString()} FCFA</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
