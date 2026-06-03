import { useEffect, useState } from "react";
import {
  X,
  UserCircle,
  Image as ImageIcon,
  Package,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

type Step = {
  icon: any;
  title: string;
  desc: string;
  cta?: string;
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Bienvenue sur votre espace Sunu Couture",
    desc: "Voici les 3 endroits clés où mettre vos médias pour donner vie à votre vitrine.",
  },
  {
    icon: UserCircle,
    title: "1. Photo de profil & bannière",
    desc: "Onglet « Ma boutique » → uploadez votre logo (carré) et votre bannière (image large) sur Cloudflare R2. Aperçu immédiat avant d'enregistrer.",
    cta: "Ma boutique",
  },
  {
    icon: ImageIcon,
    title: "2. Galerie photos & vidéos",
    desc: "Toujours dans « Ma boutique », section « Photos & vidéos » — cliquez sur « Ajouter des médias » pour montrer votre atelier, vos coulisses, vos défilés.",
    cta: "Ajouter des médias",
  },
  {
    icon: Package,
    title: "3. Médias de chaque annonce",
    desc: "Onglet « Annonces » → bouton « Médias » sur chaque ligne pour gérer les photos et vidéos d'un produit précis.",
    cta: "Mes annonces",
  },
];

const STORAGE_KEY = "sunu_onboarding_v1";

export function OnboardingTour({
  onJump,
}: {
  onJump?: (tab: "shop" | "listings") => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "done");
    setOpen(false);
  };

  if (!open) return null;
  const s = STEPS[step];
  const Icon = s.icon;

  const handleCta = () => {
    if (step === 1 || step === 2) onJump?.("shop");
    else if (step === 3) onJump?.("listings");
    close();
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <button
          onClick={close}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 px-6 py-8 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider">
            Étape {step + 1} / {STEPS.length}
          </span>
          <div className="mt-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-display text-xl text-slate-900">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((n) => Math.max(0, n - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Retour
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCta}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                C'est parti <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {s.cta && step > 0 && step < STEPS.length - 1 && (
            <button
              onClick={handleCta}
              className="mt-3 w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Aller à : {s.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
