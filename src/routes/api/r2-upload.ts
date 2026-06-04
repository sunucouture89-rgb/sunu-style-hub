import { createFileRoute } from "@tanstack/react-router";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_IMAGE = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED = new Set([...ALLOWED_IMAGE, ...ALLOWED_VIDEO]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

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

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
}

async function verifyUser(request: Request): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Missing Authorization header" }, 401);
  const token = auth.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return json({ error: "Supabase env vars missing on server" }, 500);
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return json({ error: "Invalid or expired session" }, 401);
  return { userId: data.claims.sub as string };
}

function r2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    throw new Error(
      "R2 not configured (missing R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_PUBLIC_URL)",
    );
  }
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket, publicBase: publicBase.replace(/\/+$/, "") };
}

export const Route = createFileRoute("/api/r2-upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const authed = await verifyUser(request);
          if (authed instanceof Response) return authed;
          const { userId } = authed;

          let form: FormData;
          try {
            form = await request.formData();
          } catch (e: any) {
            return json({ error: `Invalid form data: ${e?.message ?? e}` }, 400);
          }

          const file = form.get("file");
          const folderRaw = (form.get("folder") as string | null) ?? "uploads";
          const folder = folderRaw.replace(/[^a-z0-9/_-]/gi, "") || "uploads";

          if (!(file instanceof File)) return json({ error: "Missing 'file' field" }, 400);
          if (!file.size) return json({ error: "Empty file" }, 400);

          const type = file.type || "application/octet-stream";
          if (!ALLOWED.has(type)) {
            return json(
              {
                error: `Unsupported file type: ${type}. Allowed: jpg, png, webp, mp4, mov, webm.`,
              },
              415,
            );
          }
          const isVideo = ALLOWED_VIDEO.includes(type);
          const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
          if (file.size > maxBytes) {
            return json(
              {
                error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max ${(maxBytes / 1024 / 1024) | 0} MB.`,
              },
              413,
            );
          }

          const { client, bucket, publicBase } = r2();
          const key = `${folder}/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitize(file.name)}`;
          const bytes = new Uint8Array(await file.arrayBuffer());

          try {
            await client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: bytes,
                ContentType: type,
              }),
            );
          } catch (e: any) {
            console.error("[r2-upload] PutObject failed", {
              name: e?.name,
              code: e?.Code ?? e?.code,
              status: e?.$metadata?.httpStatusCode,
              message: e?.message,
            });
            return json(
              {
                error: `R2 upload failed: ${e?.name ?? "Error"} ${e?.message ?? ""}`.trim(),
              },
              502,
            );
          }

          return json({
            key,
            publicUrl: `${publicBase}/${key}`,
            contentType: type,
            name: file.name,
            size: file.size,
          });
        } catch (e: any) {
          console.error("[r2-upload] unhandled", e);
          return json({ error: e?.message ?? "Unexpected server error" }, 500);
        }
      },
    },
  },
});
