import { Ruler, MessageCircle, Scissors, PackageCheck } from "lucide-react";

const steps = [
  { icon: Ruler, title: "Vos mesures", text: "Renseignez vos mesures ou uploadez votre modèle préféré." },
  { icon: MessageCircle, title: "Échange artisan", text: "Discutez tissus, couleurs et délais en messagerie sécurisée." },
  { icon: Scissors, title: "Confection main", text: "Votre pièce est cousue avec soin par un maître couturier." },
  { icon: PackageCheck, title: "Livraison Sénégal", text: "Suivi en temps réel jusqu'à votre porte, partout au pays." },
];

export function SurMesure() {
  return (
    <section id="sur-mesure" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">— Le sur-mesure, simplement</div>
          <h2 className="font-display text-4xl text-balance md:text-5xl lg:text-6xl">
            De l'idée à la pièce unique, en <em className="gold-text not-italic">4 étapes</em>.
          </h2>
          <p className="mt-5 text-muted-foreground">
            Sunu Couture orchestre votre commande sur mesure du premier message
            jusqu'à la livraison, avec paiement sécurisé via Wave, Orange Money,
            Free Money ou carte bancaire.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-2xl border border-border bg-card p-6 transition hover:border-gold hover:shadow-luxe"
            >
              <div className="absolute right-5 top-5 font-display text-5xl text-foreground/5">
                0{i + 1}
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-royal text-ivory shadow-gold">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
