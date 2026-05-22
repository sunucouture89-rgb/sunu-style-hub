import type { AppRole } from "@/hooks/use-auth";

export type AuthRedirect = "/" | "/dashboard" | "/dashboard/listings/new" | "/messages" | "/favorites" | "/uploads";

const AUTH_REDIRECTS = new Set<string>(["/", "/dashboard", "/dashboard/listings/new", "/messages", "/favorites", "/uploads"]);

export function parseAuthRedirect(value: unknown): AuthRedirect | undefined {
  return typeof value === "string" && AUTH_REDIRECTS.has(value) ? (value as AuthRedirect) : undefined;
}

export function defaultAuthRedirect(roles: AppRole[]): AuthRedirect {
  return roles.includes("couturier") ? "/dashboard" : "/";
}

export function resolveAuthRedirect(redirect: AuthRedirect | undefined, roles: AppRole[]): AuthRedirect {
  return redirect ?? defaultAuthRedirect(roles);
}