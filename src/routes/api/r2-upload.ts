import { createFileRoute } from "@tanstack/react-router";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extraHeaders },
  });
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
}

function validateR2BucketName(bucket: string) {
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
    return "R2_BUCKET_NAME is invalid. Use only the bucket name: 3–63 chars, lowercase letters, numbers, and hyphens only. Do not use a URL, uppercase letters, underscores, dots, or slashes.";
  }
  return null;
}

async function logFailure(opts: {
  userId?: string;
  folder?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  statusCode: number;
  error: string;
  requestId: string;
  userAgent?: string;
}) {
  try {
    await supabaseAdmin.from("upload_failures").insert({
      user_id: opts.userId ?? null,
      folder: opts.folder ?? null,
      file_name: opts.fileName ?? null,
      file_size: opts.fileSize ?? null,
      content_type: opts.contentType ?? null,
      status_code: opts.statusCode,
      error: opts.error.slice(0, 2000),
      request_id: opts.requestId,
      user_agent: opts.userAgent?.slice(0, 500) ?? null,
    });
  } catch (e) {
    console.error("[r2-upload] failed to log failure", e);
  }
}

async function verifyUser(request: Request): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Missing Authorization header", code: "no_auth" }, 401);
  const token = auth.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return json({ error: "Supabase env vars missing on server", code: "server_misconfig" }, 500);
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return json({ error: "Invalid or expired session", code: "bad_token" }, 401);
  return { userId: data.claims.sub as string };
}

function r2() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_URL;
  const missing = [
    !endpoint && "R2_ENDPOINT",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET_NAME",
    !publicBase && "R2_PUBLIC_URL",
  ].filter(Boolean) as string[];
  if (missing.length) {
    throw new Error(`R2 not configured. Missing env vars: ${missing.join(", ")}`);
  }

  const bucketError = validateR2BucketName(bucket!);
  if (bucketError) {
    throw new Error(bucketError);
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    }),
    bucket: bucket!,
    publicBase: publicBase!.replace(/\/+$/, ""),
  };
}

export const Route = createFileRoute("/api/r2-upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const requestId = crypto.randomUUID();
        const userAgent = request.headers.get("user-agent") ?? undefined;
        let userId: string | undefined;
        let fileName: string | undefined;
        let fileSize: number | undefined;
        let contentType: string | undefined;
        let folder: string | undefined;

        const fail = async (status: number, error: string, code?: string) => {
          await logFailure({ userId, folder, fileName, fileSize, contentType, statusCode: status, error, requestId, userAgent });
          return json({ error, code: code ?? "error", requestId }, status, { "X-Request-Id": requestId });
        };

        try {
          const authed = await verifyUser(request);
          if (authed instanceof Response) return authed;
          userId = authed.userId;

          let form: FormData;
          try {
            form = await request.formData();
          } catch (e: any) {
            return fail(400, `Invalid form data: ${e?.message ?? e}`, "bad_form");
          }

          const file = form.get("file");
          const folderRaw = (form.get("folder") as string | null) ?? "uploads";
          folder = folderRaw.replace(/[^a-z0-9/_-]/gi, "") || "uploads";

          if (!(file instanceof File)) return fail(400, "Missing 'file' field in form data", "missing_file");
          fileName = file.name;
          fileSize = file.size;
          contentType = file.type || "application/octet-stream";

          if (!file.size) return fail(400, "Empty file", "empty_file");
          if (!ALLOWED.has(contentType)) {
            return fail(415, `Unsupported file type: ${contentType}. Allowed: jpg, png, webp, mp4, mov, webm.`, "bad_mime");
          }
          const isVideo = ALLOWED_VIDEO.includes(contentType);
          const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
          if (file.size > maxBytes) {
            return fail(
              413,
              `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max ${(maxBytes / 1024 / 1024) | 0} MB.`,
              "too_large",
            );
          }

          let r2cfg: ReturnType<typeof r2>;
          try {
            r2cfg = r2();
          } catch (e: any) {
            return fail(500, e?.message ?? "R2 not configured", "r2_misconfig");
          }

          const key = `${folder}/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitize(file.name)}`;
          const bytes = new Uint8Array(await file.arrayBuffer());

          try {
            await r2cfg.client.send(
              new PutObjectCommand({
                Bucket: r2cfg.bucket,
                Key: key,
                Body: bytes,
                ContentType: contentType,
              }),
            );
          } catch (e: any) {
            const detail = `${e?.name ?? "Error"} ${e?.Code ?? e?.code ?? ""} ${e?.message ?? ""}`.trim();
            console.error("[r2-upload] PutObject failed", {
              requestId,
              status: e?.$metadata?.httpStatusCode,
              detail,
            });
            return fail(500, `R2 upload failed: ${detail}`, "r2_put_failed");
          }

          return json(
            {
              key,
              publicUrl: `${r2cfg.publicBase}/${key}`,
              contentType,
              name: file.name,
              size: file.size,
              requestId,
            },
            200,
            { "X-Request-Id": requestId },
          );
        } catch (e: any) {
          console.error("[r2-upload] unhandled", { requestId, error: e });
          return fail(500, e?.message ?? "Unexpected server error", "unhandled");
        }
      },
    },
  },
});
