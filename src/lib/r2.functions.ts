import { createServerFn } from "@tanstack/react-start";
import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 environment variables missing");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function publicUrlFor(key: string) {
  const base = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  return `${base}/${key}`;
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export const getR2UploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { fileName: string; contentType: string; folder?: string }) => {
      if (!input?.fileName || !input?.contentType) {
        throw new Error("fileName and contentType are required");
      }
      const folder = (input.folder || "uploads").replace(/[^a-z0-9/_-]/gi, "");
      return { fileName: input.fileName, contentType: input.contentType, folder };
    },
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const bucket = process.env.R2_BUCKET_NAME!;
    const key = `${data.folder}/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitize(data.fileName)}`;
    const client = getR2Client();
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: data.contentType,
    });
    const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 600 });
    return { uploadUrl, key, publicUrl: publicUrlFor(key) };
  });

export const deleteR2Object = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => {
    if (!input?.key) throw new Error("key is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Only allow deleting objects owned by the user (path-based ownership).
    if (!data.key.includes(`/${userId}/`)) {
      throw new Error("Forbidden");
    }
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: data.key }),
    );
    return { ok: true };
  });
