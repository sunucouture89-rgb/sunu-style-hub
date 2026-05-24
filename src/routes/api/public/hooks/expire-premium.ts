import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Cron-callable endpoint: expire premium listings whose premium_until is in the past.
// Schedule with pg_cron + pg_net (see schedule-jobs knowledge).
export const Route = createFileRoute("/api/public/hooks/expire-premium")({
  server: {
    handlers: {
      POST: async () => {
        const { data, error } = await supabaseAdmin
          .from("listings")
          .update({ is_premium: false })
          .lt("premium_until", new Date().toISOString())
          .eq("is_premium", true)
          .select("id");
        if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ ok: true, expired: data?.length ?? 0 }), { headers: { "Content-Type": "application/json" } });
      },
      GET: async () => new Response("ok"),
    },
  },
});
