import { createFileRoute } from "@tanstack/react-router";
import { S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Missing Authorization header" }, 401);
  const token = auth.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return json({ error: "Invalid session" }, 401);
  const { data: roleRow } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", data.claims.sub)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);
  return null;
}

export const Route = createFileRoute("/api/r2-diagnostic")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const guard = await requireAdmin(request);
        if (guard) return guard;

        const env = {
          R2_ENDPOINT: !!process.env.R2_ENDPOINT,
          R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
          R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
          R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
        };
        const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);

        const result: any = {
          env,
          missing,
          bucket: process.env.R2_BUCKET_NAME ?? null,
          endpoint: process.env.R2_ENDPOINT ?? null,
          publicUrl: process.env.R2_PUBLIC_URL ?? null,
          headBucket: { ok: false, error: null as string | null },
          writeProbe: { ok: false, key: null as string | null, error: null as string | null },
          deleteProbe: { ok: false, error: null as string | null },
        };

        if (missing.length) {
          return json({ ok: false, ...result, error: `Missing env vars: ${missing.join(", ")}` }, 500);
        }

        const client = new S3Client({
          region: "auto",
          endpoint: process.env.R2_ENDPOINT!,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          },
        });
        const Bucket = process.env.R2_BUCKET_NAME!;

        try {
          await client.send(new HeadBucketCommand({ Bucket }));
          result.headBucket.ok = true;
        } catch (e: any) {
          result.headBucket.error = `${e?.name}: ${e?.message}`;
        }

        const probeKey = `__diagnostic/${Date.now()}.txt`;
        try {
          await client.send(
            new PutObjectCommand({
              Bucket,
              Key: probeKey,
              Body: new Uint8Array([104, 105]), // "hi"
              ContentType: "text/plain",
            }),
          );
          result.writeProbe.ok = true;
          result.writeProbe.key = probeKey;
        } catch (e: any) {
          result.writeProbe.error = `${e?.name}: ${e?.message}`;
        }

        if (result.writeProbe.ok) {
          try {
            await client.send(new DeleteObjectCommand({ Bucket, Key: probeKey }));
            result.deleteProbe.ok = true;
          } catch (e: any) {
            result.deleteProbe.error = `${e?.name}: ${e?.message}`;
          }
        }

        const ok = result.headBucket.ok && result.writeProbe.ok;
        return json({ ok, ...result }, ok ? 200 : 502);
      },
    },
  },
});
