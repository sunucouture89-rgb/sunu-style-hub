// Shared validation for shop descriptions (client + server).
export const DESCRIPTION_MIN = 40;
export const DESCRIPTION_MAX = 600;
export const DESCRIPTION_HARD_MAX = 2000;

// Mots interdits (insultes, spam, contenus inappropriés). Comparaison insensible à la casse / accents.
export const FORBIDDEN_WORDS = [
  "connard", "connasse", "salope", "pute", "putain", "merde", "enculé", "enculer",
  "nique", "niquer", "bâtard", "batard", "fdp", "ntm",
  "arnaque", "arnaqueur", "escroc", "escroquerie", "fraude",
  "viagra", "casino", "porn", "porno", "pornographie", "xxx",
  "bitcoin", "crypto gratuit", "gagnez de l'argent", "cliquez ici",
];

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export type DescriptionIssue =
  | { type: "too_short"; message: string }
  | { type: "too_long"; message: string }
  | { type: "forbidden"; word: string; message: string }
  | { type: "url_spam"; message: string };

export function validateDescription(text: string): DescriptionIssue[] {
  const issues: DescriptionIssue[] = [];
  const trimmed = text.trim();

  if (trimmed.length < DESCRIPTION_MIN) {
    issues.push({
      type: "too_short",
      message: `Description trop courte (${trimmed.length}/${DESCRIPTION_MIN} caractères minimum).`,
    });
  }
  if (trimmed.length > DESCRIPTION_HARD_MAX) {
    issues.push({
      type: "too_long",
      message: `Description trop longue (${trimmed.length}/${DESCRIPTION_HARD_MAX} caractères maximum).`,
    });
  }

  const normalized = stripDiacritics(trimmed);
  for (const w of FORBIDDEN_WORDS) {
    const needle = stripDiacritics(w);
    const pattern = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(normalized)) {
      issues.push({
        type: "forbidden",
        word: w,
        message: `Mot interdit détecté : « ${w} ». Merci de reformuler.`,
      });
      break;
    }
  }

  const urlCount = (trimmed.match(/https?:\/\//gi) ?? []).length;
  if (urlCount > 1) {
    issues.push({
      type: "url_spam",
      message: "Trop de liens dans la description (max 1).",
    });
  }

  return issues;
}

// Réduit un texte trop long à la dernière phrase complète sous la limite.
export function clampToSentence(text: string, max = DESCRIPTION_MAX): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  return lastStop > max * 0.6 ? cut.slice(0, lastStop + 1).trim() : cut.trim() + "…";
}
