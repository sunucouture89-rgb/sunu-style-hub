import boubou from "@/assets/category-boubou-homme.jpg";
import mariage from "@/assets/category-mariage.jpg";
import bazin from "@/assets/category-bazin.jpg";
import tissus from "@/assets/category-tissus.jpg";
import { ArrowUpRight } from "lucide-react";

const categories = [
  { title: "Grand Boubou", count: "2 480 pièces", img: boubou, accent: "Homme & Femme" },
  { title: "Mariage", count: "960 créations", img: mariage, accent: "Cérémonie" },
  { title: "Bazin Riche", count: "3 120 pièces", img: bazin, accent: "Tradition" },
  { title: "Tissus & Broderie", count: "1 540 modèles", img: tissus, accent: "Artisanat" },
];

export function Categories() {
  return (
    <section id="categories" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
              — Catégories phares
            </div>
            <h2 className="font-display text-4xl text-balance md:text-5xl lg:text-6xl">
              Une garde-robe à la hauteur de votre <em className="gold-text not-italic">héritage</em>.
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm transition hover:bg-foreground hover:text-background"
          >
            Toutes les catégories
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <a
              key={c.title}
              href="#"
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img
                src={c.img}
                alt={c.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{c.accent}</div>
                <div className="mt-1 flex items-end justify-between">
                  <div>
                    <div className="font-display text-2xl">{c.title}</div>
                    <div className="text-xs text-ivory/70">{c.count}</div>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-ivory/30 backdrop-blur-md transition group-hover:bg-gold group-hover:text-onyx">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
