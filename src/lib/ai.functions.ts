import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  clampToSentence,
  DESCRIPTION_MAX,
  validateDescription,
} from "./description-validation";


type Input = {
  name?: string;
  tagline?: string;
  city?: string;
  country?: string;
  current?: string;
  keywords?: string;
};

export const generateShopDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown): Input => {
    const i = (input ?? {}) as Input;
    return {
      name: typeof i.name === "string" ? i.name.slice(0, 200) : "",
      tagline: typeof i.tagline === "string" ? i.tagline.slice(0, 200) : "",
      city: typeof i.city === "string" ? i.city.slice(0, 100) : "",
      country: typeof i.country === "string" ? i.country.slice(0, 100) : "",
      current: typeof i.current === "string" ? i.current.slice(0, 2000) : "",
      keywords: typeof i.keywords === "string" ? i.keywords.slice(0, 500) : "",
    };
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Configuration IA manquante");

    const context = [
      data.name && `Nom : ${data.name}`,
      data.tagline && `Slogan : ${data.tagline}`,
      (data.city || data.country) && `Localisation : ${[data.city, data.country].filter(Boolean).join(", ")}`,
      data.keywords && `Mots-clés / spécialités : ${data.keywords}`,
      data.current && `Description actuelle à améliorer :\n${data.current}`,
    ].filter(Boolean).join("\n");

    const system =
      "Tu es un rédacteur expert en mode et artisanat africain (couture sénégalaise, wax, bazin, sur-mesure). " +
      "Rédige une description de boutique en français, chaleureuse et professionnelle, entre 3 et 5 phrases (max 600 caractères). " +
      "Mets en avant le savoir-faire, le style et l'expérience client. Pas d'emojis, pas de titres, pas de listes, texte fluide uniquement. " +
      "Réponds UNIQUEMENT avec le texte de la description, sans guillemets ni préambule.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: context || "Génère une description générique pour un atelier de couture sénégalais haut de gamme." },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Trop de requêtes, réessayez dans un instant");
    if (res.status === 402) throw new Error("Crédits IA épuisés — rechargez votre espace");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Erreur IA (${res.status}): ${t.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("Réponse IA vide");

    // Nettoyage : retire guillemets, markdown, coupe à une phrase complète sous la limite.
    const cleaned = raw.replace(/^["'«»\s]+|["'«»\s]+$/g, "").replace(/[*_#`>]/g, "");
    const description = clampToSentence(cleaned, DESCRIPTION_MAX);

    const issues = validateDescription(description);
    const blocking = issues.filter((i) => i.type === "forbidden" || i.type === "too_long");
    if (blocking.length > 0) {
      throw new Error(
        "L'IA a produit un contenu non conforme : " +
          blocking.map((i) => i.message).join(" ") +
          " Réessayez avec d'autres mots-clés.",
      );
    }
    return { description, issues };
  });

