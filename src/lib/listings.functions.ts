import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ----- Premium boost -----
const BOOST_PRICES: Record<number, number> = { 1: 500, 7: 2500, 30: 7500, 90: 20000 };

export const boostListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      listingId: z.string().uuid(),
      durationDays: z.number().int().refine((n) => [1, 7, 30, 90].includes(n), "Durée invalide"),
      paymentMethod: z.enum(["manual", "wave", "orange_money", "stripe"]).default("manual"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: listing, error: lErr } = await supabase
      .from("listings")
      .select("id, couturier_id, premium_until")
      .eq("id", data.listingId)
      .maybeSingle();
    if (lErr) throw new Error(lErr.message);
    if (!listing) throw new Error("Annonce introuvable");
    if (listing.couturier_id !== userId) throw new Error("Non autorisé");

    const now = Date.now();
    const base = listing.premium_until && new Date(listing.premium_until).getTime() > now
      ? new Date(listing.premium_until).getTime()
      : now;
    const until = new Date(base + data.durationDays * 86400_000).toISOString();
    const amount = BOOST_PRICES[data.durationDays];

    const { error: uErr } = await supabase
      .from("listings")
      .update({ is_premium: true, premium_until: until })
      .eq("id", data.listingId);
    if (uErr) throw new Error(uErr.message);

    await (supabase as any).from("premium_transactions").insert({
      listing_id: data.listingId,
      couturier_id: userId,
      duration_days: data.durationDays,
      amount_xof: amount,
      payment_method: data.paymentMethod,
      status: "paid",
    });

    return { ok: true, premium_until: until };
  });

// ----- Admin moderation -----
export const moderateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      listingId: z.string().uuid(),
      action: z.enum(["approve", "reject", "feature", "delete"]),
      reason: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check admin role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Accès admin requis");

    const { data: listing } = await supabase.from("listings").select("id, couturier_id, title").eq("id", data.listingId).maybeSingle();
    if (!listing) throw new Error("Annonce introuvable");

    if (data.action === "delete") {
      const { error } = await supabase.from("listings").delete().eq("id", data.listingId);
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("notifications").insert({
        user_id: listing.couturier_id,
        type: "listing_deleted",
        title: "Annonce supprimée",
        body: `Votre annonce « ${listing.title} » a été supprimée par l'équipe.`,
      });
      return { ok: true };
    }

    const patch: any = {};
    let notifTitle = "";
    let notifBody = "";
    if (data.action === "approve") {
      patch.status = "active";
      patch.rejection_reason = null;
      notifTitle = "Annonce approuvée 🎉";
      notifBody = `« ${listing.title} » est en ligne.`;
    } else if (data.action === "reject") {
      patch.status = "rejected";
      patch.rejection_reason = data.reason ?? null;
      notifTitle = "Annonce refusée";
      notifBody = `« ${listing.title} » a été refusée${data.reason ? ` : ${data.reason}` : "."}`;
    } else if (data.action === "feature") {
      patch.is_premium = true;
      patch.premium_until = new Date(Date.now() + 7 * 86400_000).toISOString();
      notifTitle = "Annonce mise en avant ✨";
      notifBody = `« ${listing.title} » est en première page pour 7 jours.`;
    }

    const { error } = await supabase.from("listings").update(patch).eq("id", data.listingId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: listing.couturier_id,
      type: `listing_${data.action}d`,
      title: notifTitle,
      body: notifBody,
      link: `/annonces/${data.listingId}`,
    });

    return { ok: true };
  });

// ----- AI: suggestions + spam score -----
export const aiAssistListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      title: z.string().min(3).max(200),
      description: z.string().max(2000).optional(),
      category: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI non configuré");

    const prompt = `Tu es un assistant éditorial pour Sunu Couture, marketplace de couturiers sénégalais.
Analyse cette annonce et retourne UNIQUEMENT du JSON valide :
{
  "spam_score": number (0=ok, 100=spam évident),
  "tags": string[] (3 à 8 tags pertinents en français, sans #, courts),
  "improved_description": string (description améliorée, ton premium et chaleureux, 80-200 mots, garde l'esprit de l'auteur),
  "warnings": string[] (problèmes : prix manquant, fautes, contenu interdit, etc.)
}

Titre: ${data.title}
Catégorie: ${data.category ?? "n/a"}
Description: ${data.description ?? "(vide)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Trop de requêtes — réessayez dans une minute.");
    if (res.status === 402) throw new Error("Crédits IA épuisés — ajoutez-en dans Lovable AI.");
    if (!res.ok) throw new Error(`Erreur IA ${res.status}`);

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Réponse IA vide");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Réponse IA non parsable");
    }

    return {
      spam_score: Number(parsed.spam_score ?? 0),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10).map(String) : [],
      improved_description: String(parsed.improved_description ?? ""),
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [],
    };
  });

// ----- Admin: list pending + stats -----
export const listAdminQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) throw new Error("Accès admin requis");

    const [{ data: pending }, { data: recent }, { data: tx }] = await Promise.all([
      supabase.from("listings").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("listings").select("id, title, status, is_premium, created_at, couturier_id, cover_image_url").order("created_at", { ascending: false }).limit(20),
      (supabase as any).from("premium_transactions").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      pending: pending ?? [],
      recent: recent ?? [],
      transactions: tx ?? [],
    };
  });
