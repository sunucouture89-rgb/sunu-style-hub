import { Star } from "lucide-react";

const testimonials = [
  { name: "Fatou D.", city: "Dakar", text: "J'ai commandé mon boubou de mariage sur Sunu Couture — l'atelier a sublimé chaque détail. Inoubliable.", rating: 5 },
  { name: "Ibrahima S.", city: "Touba", text: "Un grand boubou cousu à Touba, livré à Dakar en 5 jours. Le sur-mesure n'a jamais été aussi simple.", rating: 5 },
  { name: "Aïcha M.", city: "Thiès", text: "Le bazin riche est d'une qualité incroyable, et le paiement Wave a été instantané. Je recommande !", rating: 5 },
];

export function Testimonials() {
  return (
    <section className="relative bg-secondary/50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 max-w-2xl">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">— Témoignages</div>
          <h2 className="font-display text-4xl text-balance md:text-5xl lg:text-6xl">
            Ce que disent nos <em className="gold-text not-italic">clients</em>.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-7"
            >
              <span className="absolute right-6 top-2 font-display text-7xl leading-none text-gold/30">"</span>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <blockquote className="mt-4 font-display text-xl leading-snug text-balance">
                {t.text}
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.city}, Sénégal</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
