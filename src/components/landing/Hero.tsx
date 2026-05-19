import { ArrowRight, Search, MapPin, Sparkles } from "lucide-react";
import hero from "@/assets/hero-couture.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-dark-gradient pt-28 text-ivory">
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="absolute -left-32 top-40 h-96 w-96 rounded-full bg-emerald/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:pt-24">
        <div className="flex flex-col justify-center animate-fade-up">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-onyx/40 px-3.5 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            La Maison Sénégalaise du Sur-Mesure
          </div>

          <h1 className="font-display text-5xl leading-[1.05] text-balance md:text-6xl lg:text-7xl">
            L'élégance africaine,{" "}
            <span className="italic gold-text">cousue main</span> par nos
            maîtres couturiers.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-ivory/70">
            Découvrez les plus belles créations du Sénégal — boubou, bazin riche,
            tenues de mariage et broderies d'exception. Commandez directement
            auprès de l'artisan, partout dans le pays.
          </p>

          {/* Search */}
          <div className="mt-9 flex flex-col gap-3 rounded-2xl border border-ivory/10 bg-onyx/50 p-3 backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 px-3">
              <Search className="h-4 w-4 text-gold" />
              <input
                className="w-full bg-transparent py-2.5 text-sm text-ivory placeholder:text-ivory/40 focus:outline-none"
                placeholder="Boubou, bazin, mariage..."
              />
            </div>
            <div className="flex items-center gap-2.5 border-t border-ivory/10 px-3 sm:border-l sm:border-t-0">
              <MapPin className="h-4 w-4 text-gold" />
              <select className="w-full bg-transparent py-2.5 text-sm text-ivory focus:outline-none">
                <option className="bg-onyx">Tout le Sénégal</option>
                <option className="bg-onyx">Dakar</option>
                <option className="bg-onyx">Thiès</option>
                <option className="bg-onyx">Saint-Louis</option>
                <option className="bg-onyx">Touba</option>
              </select>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-5 py-3 text-sm font-semibold text-onyx transition hover:brightness-105">
              Explorer
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-ivory/10 pt-8">
            {[
              ["1 200+", "Couturiers vérifiés"],
              ["28 000", "Créations en ligne"],
              ["14", "Régions du Sénégal"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-3xl gold-text">{n}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-ivory/55">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="relative animate-fade-up">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-luxe">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-deep/40 via-transparent to-gold/20 mix-blend-overlay" />
            <img
              src={hero}
              alt="Création couture sénégalaise — boubou émeraude brodé d'or"
              className="h-full w-full object-cover"
              width={1280}
              height={1600}
            />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-ivory/15 bg-onyx/70 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-gold">Pièce signature</div>
                  <div className="font-display text-xl text-ivory">Grand Boubou « Téranga »</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ivory/60">à partir de</div>
                  <div className="font-display text-xl text-ivory">85 000 <span className="text-sm">FCFA</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-gold/30 bg-onyx/80 px-5 py-4 shadow-gold backdrop-blur-xl sm:block animate-float">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-onyx bg-gradient-to-br from-gold to-emerald"
                  />
                ))}
              </div>
              <div>
                <div className="font-display text-base">4.9 ★ · 12k avis</div>
                <div className="text-xs text-ivory/60">de clients satisfaits</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand strip */}
      <div className="relative border-t border-ivory/10 bg-onyx/40 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-xs uppercase tracking-[0.3em] text-ivory/45">
          <span>Wave</span><span className="text-gold">◆</span>
          <span>Orange Money</span><span className="text-gold">◆</span>
          <span>Free Money</span><span className="text-gold">◆</span>
          <span>Visa</span><span className="text-gold">◆</span>
          <span>Mastercard</span><span className="text-gold">◆</span>
          <span>PayPal</span>
        </div>
      </div>
    </section>
  );
}
