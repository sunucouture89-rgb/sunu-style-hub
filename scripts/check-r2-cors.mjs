#!/usr/bin/env node
/**
 * Vérifie que la CORS policy du bucket R2 autorise les origines attendues.
 *
 * Utilise l'API S3 compatible R2 (GetBucketCors) via les mêmes credentials
 * que ceux configurés en secrets Worker. Ces variables doivent être
 * disponibles localement (via .env ou l'environnement du shell) :
 *   - R2_ENDPOINT
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *   - R2_BUCKET_NAME
 *
 * Origines attendues (modifiables via EXPECTED_ORIGINS, séparées par une virgule).
 */
import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const DEFAULT_ORIGINS = [
  "https://sunu-style-studio.lovable.app",
  "https://id-preview--3ca5ddde-06b9-4c2c-9dc1-0912f10609c2.lovable.app",
  "http://localhost:8080",
];

const EXPECTED_ORIGINS = (process.env.EXPECTED_ORIGINS
  ? process.env.EXPECTED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ORIGINS);

const EXPECTED_METHODS = ["PUT", "GET", "HEAD"];

function die(msg) {
  console.error(`\n${RED}✖ ${msg}${RESET}\n`);
  process.exit(1);
}

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
const missing = ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"].filter(
  (k) => !process.env[k],
);
if (missing.length) die(`Variables manquantes en local : ${missing.join(", ")}.\nExporte-les dans ton shell ou ton .env avant de lancer ce script.`);

const client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

console.log(`${DIM}→ Vérification CORS du bucket '${R2_BUCKET_NAME}'…${RESET}`);

let cors;
try {
  const resp = await client.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET_NAME }));
  cors = resp.CORSRules ?? [];
} catch (e) {
  if (e?.name === "NoSuchCORSConfiguration") {
    console.error(`\n${RED}✖ Aucune CORS policy définie sur le bucket '${R2_BUCKET_NAME}'.${RESET}`);
    console.error(`\nAjoute cette policy dans Cloudflare Dashboard → R2 → ${R2_BUCKET_NAME} → Settings → CORS Policy :\n`);
    console.error(suggestedPolicy());
    process.exit(1);
  }
  die(`Impossible de lire la CORS policy : ${e?.name}: ${e?.message}`);
}

const allowedOrigins = new Set(cors.flatMap((r) => r.AllowedOrigins ?? []));
const allowedMethods = new Set(cors.flatMap((r) => r.AllowedMethods ?? []));

const missingOrigins = EXPECTED_ORIGINS.filter((o) => !allowedOrigins.has(o) && !allowedOrigins.has("*"));
const missingMethods = EXPECTED_METHODS.filter((m) => !allowedMethods.has(m));

if (!missingOrigins.length && !missingMethods.length) {
  console.log(`${GREEN}✓ CORS OK — origines et méthodes couvertes.${RESET}`);
  process.exit(0);
}

console.error(`\n${RED}✖ La CORS policy du bucket ne correspond pas aux attentes.${RESET}\n`);
if (missingOrigins.length) {
  console.error(`${YELLOW}Origines manquantes :${RESET}`);
  for (const o of missingOrigins) console.error(`  - ${o}`);
}
if (missingMethods.length) {
  console.error(`\n${YELLOW}Méthodes manquantes :${RESET} ${missingMethods.join(", ")}`);
}
console.error(`\nPolicy suggérée :\n`);
console.error(suggestedPolicy());
process.exit(1);

function suggestedPolicy() {
  return JSON.stringify(
    [
      {
        AllowedOrigins: EXPECTED_ORIGINS,
        AllowedMethods: EXPECTED_METHODS,
        AllowedHeaders: ["content-type"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ],
    null,
    2,
  );
}
