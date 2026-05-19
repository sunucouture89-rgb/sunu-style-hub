import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-dark-gradient py-24 text-ivory lg:py-32">
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 px-3.5 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Vous êtes couturier ?
        </div>
        <h2 className="font-display text-5xl text-balance md:text-6xl lg:text-7xl">
          Donnez à votre atelier l'éclat
          <span className="block italic gold-text">qu'il mérite.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-ivory/70">
          Publiez gratuitement vos créations, recevez des commandes du Sénégal
          entier et boostez votre visibilité avec nos annonces premium.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-semibold text-onyx shadow-gold transition hover:brightness-105"
          >
            Ouvrir ma boutique
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-7 py-3.5 text-sm font-medium text-ivory transition hover:bg-ivory/10"
          >
            Voir les tarifs Premium
          </a>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-ivory/10 pt-8 text-left sm:text-center">
          <div>
            <div className="font-display text-3xl gold-text">0 FCFA</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-ivory/55">Inscription</div>
          </div>
          <div>
            <div className="font-display text-3xl gold-text">24 h</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-ivory/55">Validation</div>
          </div>
          <div>
            <div className="font-display text-3xl gold-text">5 %</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-ivory/55">Commission</div>
          </div>
        </div>
      </div>
    </section>
  );
}
