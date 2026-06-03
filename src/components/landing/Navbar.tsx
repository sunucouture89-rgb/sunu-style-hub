import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag, User, LogOut, LayoutDashboard, MessageCircle, Heart } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.png";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/annonces", label: "Annonces" },
  { href: "/#categories", label: "Catégories" },
  { href: "/#couturiers", label: "Couturiers" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const isCouturier = roles.includes("couturier");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Sunu Couture" className="h-12 w-12 object-contain" />
          <span className="font-display text-2xl tracking-tight hidden sm:inline">
            Sunu <span className="italic gold-text">Couture</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-secondary hover:text-foreground">
            <Search className="h-4 w-4" />
          </button>
          {user && (
            <Link to="/messages" className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-secondary hover:text-foreground">
              <MessageCircle className="h-4 w-4" />
            </Link>
          )}
          {user && (
            <Link to="/favorites" className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-secondary hover:text-foreground">
              <Heart className="h-4 w-4" />
            </Link>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-secondary hover:text-foreground">
            <ShoppingBag className="h-4 w-4" />
          </button>

          {!user ? (
            <>
              <Link to="/login" className="ml-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary">
                Connexion
              </Link>
              <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-luxe transition hover:opacity-90">
                Devenir couturier
              </Link>
            </>
          ) : (
            <div className="relative ml-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="max-w-[8rem] truncate">{user.email?.split("@")[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-luxe">
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary"
                  >
                    <LayoutDashboard className="h-4 w-4" /> {isCouturier ? "Ma boutique" : "Devenir couturier"}
                  </Link>

                  <Link to="/messages" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                    <MessageCircle className="h-4 w-4" /> Messages
                  </Link>
                  <Link to="/favorites" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                    <Heart className="h-4 w-4" /> Favoris
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm hover:bg-secondary">
                    <LogOut className="h-4 w-4" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="grid h-10 w-10 place-items-center rounded-full md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary">
                {l.label}
              </a>
            ))}
            {!user ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="rounded-full border border-border px-4 py-2.5 text-center text-sm">
                  Connexion
                </Link>
                <Link to="/signup" className="rounded-full bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground">
                  S'inscrire
                </Link>
              </div>
            ) : (
              <div className="mt-2 grid gap-2">
                {isCouturier && (
                  <Link to="/dashboard" className="rounded-full bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground">
                    Tableau de bord
                  </Link>
                )}
                <Link to="/messages" className="rounded-full border border-border px-4 py-2.5 text-center text-sm">
                  Messages
                </Link>
                <button onClick={handleLogout} className="rounded-full border border-border px-4 py-2.5 text-center text-sm">
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
