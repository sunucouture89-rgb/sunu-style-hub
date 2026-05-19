import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag } from "lucide-react";

const links = [
  { href: "#categories", label: "Catégories" },
  { href: "#couturiers", label: "Couturiers" },
  { href: "#creations", label: "Créations" },
  { href: "#sur-mesure", label: "Sur mesure" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-royal text-ivory shadow-gold">
            <span className="font-display text-lg italic">S</span>
          </span>
          <span className="font-display text-2xl tracking-tight">
            Sunu <span className="italic gold-text">Couture</span>
          </span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-secondary hover:text-foreground">
            <Search className="h-4 w-4" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-secondary hover:text-foreground">
            <ShoppingBag className="h-4 w-4" />
          </button>
          <a
            href="#"
            className="ml-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            Connexion
          </a>
          <a
            href="#"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-luxe transition hover:opacity-90"
          >
            Devenir couturier
          </a>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-full md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a href="#" className="rounded-full border border-border px-4 py-2.5 text-center text-sm">
                Connexion
              </a>
              <a href="#" className="rounded-full bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground">
                Devenir couturier
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
