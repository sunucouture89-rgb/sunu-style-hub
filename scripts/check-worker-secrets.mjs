#!/usr/bin/env node
/**
 * Preflight check: ensures every required Cloudflare Worker secret exists
 * before `wrangler deploy` runs. Fails fast with an actionable message when
 * one is missing so uploads don't 500 with SERVER_MISCONFIG in production.
 *
 * Reads the worker name from wrangler.jsonc and calls `wrangler secret list`.
 * Local .env values are ignored on purpose — Cloudflare Workers can't read them.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REQUIRED_SECRETS = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function die(msg) {
  console.error(`\n${RED}✖ ${msg}${RESET}\n`);
  process.exit(1);
}

// Skip in CI when explicitly opted out (e.g. first ever deploy).
if (process.env.SKIP_SECRET_CHECK === "1") {
  console.log(`${YELLOW}⚠ SKIP_SECRET_CHECK=1 — skipping Worker secret preflight${RESET}`);
  process.exit(0);
}

// Read worker name from wrangler.jsonc (strip // comments before JSON.parse).
let workerName;
try {
  const raw = readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, "");
  workerName = JSON.parse(raw).name;
} catch (e) {
  die(`Impossible de lire wrangler.jsonc: ${e.message}`);
}
if (!workerName) die("Le champ 'name' est absent de wrangler.jsonc");

console.log(`${DIM}→ Vérification des secrets du Worker '${workerName}'…${RESET}`);

let output;
try {
  output = execSync(`bunx wrangler secret list --name ${workerName}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  const stderr = (e.stderr || "").toString();
  if (/not authenticated|login/i.test(stderr)) {
    die(
      `Wrangler n'est pas authentifié. Lance:\n  ${GREEN}bunx wrangler login${RESET}\n\nOu définis CLOUDFLARE_API_TOKEN dans ton environnement.`,
    );
  }
  die(`Échec de 'wrangler secret list':\n${stderr || e.message}`);
}

// `wrangler secret list` prints JSON like: [{ "name": "FOO", "type": "secret_text" }, ...]
let existing = [];
try {
  const jsonStart = output.indexOf("[");
  if (jsonStart >= 0) existing = JSON.parse(output.slice(jsonStart)).map((s) => s.name);
} catch {
  // Fallback: grep names line-by-line.
  existing = output
    .split("\n")
    .map((l) => l.match(/"?name"?\s*[:=]\s*"?([A-Z0-9_]+)"?/i)?.[1])
    .filter(Boolean);
}

const missing = REQUIRED_SECRETS.filter((s) => !existing.includes(s));

if (missing.length === 0) {
  console.log(`${GREEN}✓ Tous les secrets Worker requis sont présents (${REQUIRED_SECRETS.length}/${REQUIRED_SECRETS.length}).${RESET}`);
  process.exit(0);
}

console.error(`\n${RED}✖ ${missing.length} secret(s) manquant(s) sur le Worker '${workerName}':${RESET}`);
for (const s of missing) console.error(`   - ${RED}${s}${RESET}`);
console.error(`\nAjoute-les avant de redéployer:\n`);
for (const s of missing) console.error(`   ${GREEN}bunx wrangler secret put ${s} --name ${workerName}${RESET}`);
console.error(
  `\n${DIM}Astuce: pour ignorer ce contrôle (premier déploiement), lance:\n  SKIP_SECRET_CHECK=1 bun run deploy${RESET}\n`,
);
process.exit(1);
