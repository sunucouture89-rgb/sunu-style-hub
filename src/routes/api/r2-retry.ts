import { createFileRoute } from "@tanstack/react-router";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function requireAdmin(request: Request): Promise<{ adminId: string } | Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Missing Authorization header" }, 401);
  const token = auth.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return json({ error: "Invalid session" }, 401);
  const adminId = data.claims.sub as string;
  const { data: roleRow } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", adminId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);
  return { adminId };
}

export const Route = createFileRoute("/api/r2-retry")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const guard = await requireAdmin(request);
        if (guard instanceof Response) return guard;

        let body: { failureId?: string };
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Invalid JSON body" }, 400);
        }
        if (!body?.failureId) return json({ ok: false, error: "failureId is required" }, 400);

        const { data: failure, error: fErr } = await supabaseAdmin
          .from("upload_failures")
          .select("*")
          .eq("id", body.failureId)
          .maybeSingle();
        if (fErr) return json({ ok: false, error: fErr.message }, 500);
        if (!failure) return json({ ok: false, error: "Failure not found" }, 404);

        // 1) Re-check R2 health (HeadBucket) so we know whether a retry could plausibly succeed.
        const r2Env = {
          endpoint: process.env.R2_ENDPOINT,
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          bucket: process.env.R2_BUCKET_NAME,
        };
        const missing = Object.entries(r2Env)
          .filter(([, v]) => !v)
          .map(([k]) => k);
        let r2Ok = false;
        let r2Error: string | null = null;
        if (missing.length) {
          r2Error = `R2 not configured (missing: ${missing.join(", ")})`;
        } else {
          try {
            const client = new S3Client({
              region: "auto",
              endpoint: r2Env.endpoint!,
              credentials: {
                accessKeyId: r2Env.accessKeyId!,
                secretAccessKey: r2Env.secretAccessKey!,
              },
            });
            await client.send(new HeadBucketCommand({ Bucket: r2Env.bucket! }));
            r2Ok = true;
          } catch (e: any) {
            r2Error = `${e?.name ?? "Error"}: ${e?.message ?? "HeadBucket failed"}`;
          }
        }

        // 2) Notify the original user so they can re-upload from their device.
        //    (We cannot re-upload server-side because raw bytes are never persisted.)
        let notified = false;
        if (failure.user_id) {
          const reason = failure.error ?? "Échec inconnu";
          const title = r2Ok
            ? "Merci de renvoyer votre fichier"
            : "Upload indisponible pour le moment";
          const bodyText = r2Ok
            ? `Votre fichier "${failure.file_name ?? "média"}" n'a pas pu être enregistré (${reason}). Le stockage est désormais opérationnel — merci de le renvoyer.`
            : `Votre fichier "${failure.file_name ?? "média"}" n'a pas pu être enregistré (${reason}). Notre équipe travaille sur le stockage, réessayez plus tard.`;
          const { error: nErr } = await supabaseAdmin.from("notifications").insert({
            user_id: failure.user_id,
            type: "upload_retry",
            title,
            body: bodyText,
            link: "/dashboard",
          });
          notified = !nErr;
        }

        // 3) If R2 is healthy, archive the failure row (delete) so it leaves the queue.
        let cleared = false;
        if (r2Ok) {
          const { error: dErr } = await supabaseAdmin
            .from("upload_failures")
            .delete()
            .eq("id", failure.id);
          cleared = !dErr;
        }

        return json({
          ok: r2Ok,
          r2Ok,
          r2Error,
          notified,
          cleared,
          failure: {
            id: failure.id,
            fileName: failure.file_name,
            userId: failure.user_id,
          },
        });
      },
    },
  },
});
