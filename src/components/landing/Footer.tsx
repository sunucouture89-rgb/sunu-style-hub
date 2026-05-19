const cols = [
  { title: "Découvrir", links: ["Catégories", "Couturiers", "Nouveautés", "Premium"] },
  { title: "Services", links: ["Sur mesure", "Livraison", "Paiement Wave", "Aide & FAQ"] },
  { title: "Pour les pros", links: ["Devenir couturier", "Annonces premium", "Dashboard", "Tarifs"] },
  { title: "Entreprise", links: ["À propos", "Blog", "Contact", "Conditions"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-royal text-ivory">
                <span className="font-display text-lg italic">S</span>
              </span>
              <span className="font-display text-2xl">
                Sunu <span className="italic gold-text">Couture</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm text-muted-foreground">
              La plateforme premium de la couture sénégalaise. Connecter
              artisans, créateurs et clients à travers tout le pays — et au-delà.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-3 py-1">🇫🇷 FR</span>
              <span className="rounded-full border border-border px-3 py-1">Wolof</span>
              <span className="rounded-full border border-border px-3 py-1">EN</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-xs uppercase tracking-[0.2em] text-primary">{c.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} Sunu Couture — Fait avec ❤️ au Sénégal.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Confidentialité</a>
            <a href="#" className="hover:text-foreground">CGU</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
