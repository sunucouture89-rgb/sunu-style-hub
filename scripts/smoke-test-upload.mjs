#!/usr/bin/env node
/**
 * Smoke test post-déploiement : envoie un petit fichier via la route
 * /api/r2-upload et vérifie que la réponse est bien 200 avec une publicUrl
 * accessible.
 *
 * Requis :
 *   - DEPLOY_URL      : base URL du site déployé (ex : https://sunu-style-studio.lovable.app)
 *   - SMOKE_AUTH_TOKEN : Bearer token Supabase d'un utilisateur de test
 *
 * Optionnel :
 *   - SMOKE_FOLDER (défaut : "smoke-tests")
 */
import { Buffer } from "node:buffer";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const base = process.env.DEPLOY_URL;
const token = process.env.SMOKE_AUTH_TOKEN;
const folder = process.env.SMOKE_FOLDER || "smoke-tests";

if (!base) fail("DEPLOY_URL manquant");
if (!token) fail("SMOKE_AUTH_TOKEN manquant");

const url = `${base.replace(/\/+$/, "")}/api/r2-upload`;
console.log(`${DIM}→ POST ${url}${RESET}`);

// 1x1 PNG (67 bytes)
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const form = new FormData();
form.append("folder", folder);
form.append("file", new File([png], "smoke.png", { type: "image/png" }));

const started = Date.now();
let resp;
try {
  resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
} catch (e) {
  fail(`Requête échouée : ${e?.message ?? e}`);
}

const elapsed = Date.now() - started;
const text = await resp.text();
let body;
try { body = JSON.parse(text); } catch { body = text; }

if (resp.status !== 200) {
  console.error(`\n${RED}✖ HTTP ${resp.status} en ${elapsed}ms${RESET}`);
  console.error(body);
  process.exit(1);
}

if (!body?.publicUrl || !body?.key) {
  console.error(`\n${RED}✖ Réponse 200 mais payload inattendu :${RESET}`);
  console.error(body);
  process.exit(1);
}

console.log(`${GREEN}✓ Upload OK en ${elapsed}ms${RESET}`);
console.log(`${DIM}  key       : ${body.key}${RESET}`);
console.log(`${DIM}  publicUrl : ${body.publicUrl}${RESET}`);

// Vérifie que l'objet est accessible publiquement.
try {
  const head = await fetch(body.publicUrl, { method: "HEAD" });
  if (!head.ok) {
    console.error(`\n${RED}✖ publicUrl HEAD ${head.status} — l'objet a bien été uploadé mais n'est pas servi publiquement.${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓ publicUrl accessible (HTTP ${head.status})${RESET}`);
} catch (e) {
  console.error(`\n${RED}✖ Impossible d'atteindre publicUrl : ${e?.message ?? e}${RESET}`);
  process.exit(1);
}

function fail(msg) {
  console.error(`\n${RED}✖ ${msg}${RESET}\n`);
  process.exit(1);
}
