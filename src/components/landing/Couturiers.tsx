import { BadgeCheck, MapPin, Star } from "lucide-react";
import artisan from "@/assets/artisan-hands.jpg";

const couturiers = [
  { name: "Atelier Awa Diop", city: "Dakar — Médina", specialty: "Bazin & broderie", rating: 4.9, orders: "1 240" },
  { name: "Maison Niang", city: "Thiès", specialty: "Boubou cérémonie", rating: 4.8, orders: "820" },
  { name: "Studio Khadija", city: "Saint-Louis", specialty: "Robes de mariage", rating: 5.0, orders: "560" },
];

export function Couturiers() {
  return (
    <section id="couturiers" className="relative overflow-hidden bg-onyx py-24 text-ivory lg:py-32">
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">— Couturiers vedettes</div>
            <h2 className="font-display text-4xl text-balance md:text-5xl lg:text-6xl">
              Des mains d'<em className="gold-text not-italic">artistes</em>,
              une signature unique.
            </h2>
          </div>
          <p className="text-ivory/70">
            Tous nos couturiers sont vérifiés, notés par leurs clients et
            engagés dans la promotion du savoir-faire sénégalais. Trouvez celui
            qui sublimera vos pièces les plus précieuses.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={artisan}
              alt="Mains de couturier brodant un tissu vert et or"
              loading="lazy"
              className="aspect-[5/6] h-full w-full object-cover lg:aspect-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/20 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 max-w-md">
              <div className="text-xs uppercase tracking-[0.3em] text-gold">À la une</div>
              <div className="mt-2 font-display text-3xl">« Chaque point raconte le Sénégal. »</div>
              <div className="mt-3 text-sm text-ivory/70">— Aminata Sow, maître brodeuse, Dakar</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {couturiers.map((c) => (
              <div
                key={c.name}
                className="group flex items-center gap-5 rounded-2xl border border-ivory/10 bg-ivory/5 p-5 transition hover:border-gold/40 hover:bg-ivory/10"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-royal font-display text-2xl">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl">{c.name}</h3>
                    <BadgeCheck className="h-4 w-4 text-gold" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ivory/60">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>
                    <span>{c.specialty}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-gold text-gold" />{c.rating} · {c.orders} commandes</span>
                  </div>
                </div>
                <a
                  href="#"
                  className="rounded-full border border-ivory/20 px-4 py-2 text-xs transition group-hover:border-gold group-hover:bg-gold group-hover:text-onyx"
                >
                  Voir
                </a>
              </div>
            ))}
            <a
              href="#"
              className="mt-2 rounded-full bg-gold-gradient px-6 py-3 text-center text-sm font-semibold text-onyx transition hover:brightness-105"
            >
              Découvrir tous les couturiers
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
