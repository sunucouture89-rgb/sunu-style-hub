import { Heart, Star, BadgeCheck } from "lucide-react";
import hero from "@/assets/hero-couture.jpg";
import bazin from "@/assets/category-bazin.jpg";
import mariage from "@/assets/category-mariage.jpg";
import boubou from "@/assets/category-boubou-homme.jpg";

const items = [
  { img: hero, title: "Boubou Téranga — émeraude & or", artisan: "Atelier Awa Diop", city: "Dakar", price: "85 000", premium: true, rating: 4.9 },
  { img: bazin, title: "Bazin riche flou — vert jade", artisan: "Maison Niang", city: "Thiès", price: "62 000", premium: false, rating: 4.8 },
  { img: mariage, title: "Tenue mariage « Linguère »", artisan: "Studio Khadija", city: "Saint-Louis", price: "240 000", premium: true, rating: 5.0 },
  { img: boubou, title: "Grand boubou homme brodé", artisan: "Tailleur Babacar", city: "Touba", price: "75 000", premium: false, rating: 4.7 },
];

export function Creations() {
  return (
    <section id="creations" className="relative bg-secondary/50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
              — Créations Premium
            </div>
            <h2 className="font-display text-4xl text-balance md:text-5xl lg:text-6xl">
              Les pièces qui font <em className="gold-text not-italic">battre</em> les cœurs.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Tout", "Nouveautés", "Mariage", "Hommes", "Femmes", "Enfants"].map((t, i) => (
              <button
                key={t}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background hover:bg-foreground hover:text-background"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <article
              key={it.title}
              className="group overflow-hidden rounded-2xl bg-card shadow-sm transition hover:shadow-luxe"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={it.img}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {it.premium && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-onyx shadow-gold">
                    ★ Premium
                  </span>
                )}
                <button
                  aria-label="Favori"
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur transition hover:bg-background"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {it.artisan}
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald" />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    {it.rating}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-xl leading-tight">{it.title}</h3>
                <div className="mt-1 text-xs text-muted-foreground">{it.city} · Sénégal</div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">À partir de</div>
                    <div className="font-display text-2xl">
                      {it.price} <span className="text-sm text-muted-foreground">FCFA</span>
                    </div>
                  </div>
                  <button className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90">
                    Commander
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
