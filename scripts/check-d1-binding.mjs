#!/usr/bin/env node
/**
 * Vérifie qu'une liaison Cloudflare D1 nommée `DB` existe dans wrangler.jsonc
 * et que la base répond à un simple `SELECT 1`.
 *
 * Skippable via SKIP_D1_CHECK=1 (utile si le projet n'utilise pas D1).
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

if (process.env.SKIP_D1_CHECK === "1") {
  console.log(`${YELLOW}⚠ SKIP_D1_CHECK=1 — vérification D1 ignorée${RESET}`);
  process.exit(0);
}

function die(msg) {
  console.error(`\n${RED}✖ ${msg}${RESET}\n`);
  process.exit(1);
}

let config;
try {
  const raw = readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, "");
  config = JSON.parse(raw);
} catch (e) {
  die(`Impossible de lire wrangler.jsonc : ${e.message}`);
}

const bindings = config.d1_databases ?? [];
const db = bindings.find((b) => b.binding === "DB");

if (!db) {
  console.error(`\n${RED}✖ Aucune liaison D1 nommée 'DB' dans wrangler.jsonc.${RESET}\n`);
  console.error(`Ajoute ce bloc à wrangler.jsonc :\n`);
  console.error(`${GREEN}  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "<nom-de-ta-db>",
      "database_id": "<id-fourni-par-wrangler-d1-create>"
    }
  ]${RESET}\n`);
  console.error(`${DIM}Puis crée la base :  ${GREEN}bunx wrangler d1 create <nom-de-ta-db>${RESET}`);
  console.error(`${DIM}Pour ignorer ce contrôle : ${GREEN}SKIP_D1_CHECK=1 bun run deploy${RESET}\n`);
  process.exit(1);
}

if (!db.database_id) die(`Le binding D1 'DB' est présent mais 'database_id' est vide dans wrangler.jsonc.`);

console.log(`${DIM}→ Test de connexion D1 (binding=DB, database_name='${db.database_name}')…${RESET}`);

try {
  execSync(
    `bunx wrangler d1 execute ${JSON.stringify(db.database_name)} --remote --command ${JSON.stringify("SELECT 1 AS ok;")}`,
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  console.log(`${GREEN}✓ D1 répond correctement (SELECT 1).${RESET}`);
} catch (e) {
  const stderr = (e.stderr || "").toString();
  if (/not authenticated|login/i.test(stderr)) {
    die(`Wrangler n'est pas authentifié. Lance : ${GREEN}bunx wrangler login${RESET}`);
  }
  die(`Échec de la requête D1 :\n${stderr || e.message}`);
}
