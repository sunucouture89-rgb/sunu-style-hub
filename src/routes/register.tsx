import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseAuthRedirect } from "@/lib/auth-navigation";

export const Route = createFileRoute("/register")({
  validateSearch: (search) => ({ redirect: parseAuthRedirect(search.redirect) }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/signup", search });
  },
});