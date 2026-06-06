import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AllListings() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["home-all-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, cover_image_url, price_xof, city, category, is_premium")
        .eq("status", "active")
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="px-6 py-16 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">— Toutes les annonces</div>
            <h2 className="font-display text-3xl md:text-4xl">Découvrez toutes nos créations</h2>
            <p className="mt-1 text-sm text-foreground/70">Les annonces publiées par nos couturiers.</p>
          </div>
          <Link to="/annonces" className="hidden md:inline-block text-sm text-primary hover:underline">
            Voir la page complète →
          </Link>
        </header>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Aucune annonce publiée pour le moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.map((l: any) => (
              <Link
                key={l.id}
                to="/annonces/$id"
                params={{ id: l.id }}
                className="group relative overflow-hidden rounded-2xl bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-luxe"
              >
                <div className="aspect-[4/5] bg-muted overflow-hidden">
                  {l.cover_image_url && (
                    <img
                      src={l.cover_image_url}
                      alt={l.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                {l.is_premium && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-2.5 py-1 text-[10px] font-bold text-black">
                    <Sparkles className="h-3 w-3" /> Premium
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-white">
                  <p className="font-medium truncate">{l.title}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-80 truncate">{l.city ?? l.category}</span>
                    <span className="font-semibold whitespace-nowrap">
                      {Number(l.price_xof).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
