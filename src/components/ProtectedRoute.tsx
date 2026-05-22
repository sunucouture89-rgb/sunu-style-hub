import type { ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { parseAuthRedirect } from "@/lib/auth-navigation";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: AppRole[] }) {
  const location = useLocation();
  const { user, roles: userRoles, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <span className="inline-flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </span>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ redirect: parseAuthRedirect(location.pathname) }} />;
  }

  if (roles?.length && !roles.some((role) => userRoles.includes(role))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}