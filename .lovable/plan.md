
# Module Annonces — Plan par phases

Le projet a déjà beaucoup de briques en place : table `listings` + `listing_images`, upload R2 (`R2Uploader`), formulaire `/dashboard/listings/new`, favoris, reviews, conversations, rôles (`couturier` / `client` / `admin`), buckets publics. Plutôt que tout réécrire d'un coup (≈ 30 écrans + admin + IA + paiement premium), je propose **6 phases livrables**. Tu choisis par où on commence.

---

## Phase 1 — Catalogue & catégories (fondations)
- Étendre `listings` : `gender`, `stock`, `tags text[]`, `whatsapp_number`, `delivery_available`, `is_premium` (existe), `premium_until` (existe), `status` (existe, ajout `pending`/`rejected` pour modération).
- Nouvelle table `ad_videos` (les images existent déjà dans `listing_images`).
- Table `categories` figée (seed des 10 catégories demandées : Boubou Homme, Boubou Femme, Grand Boubou, Robes Africaines, Mariage, Broderie, Enfants, Chaussures, Accessoires, Luxe).
- Étendre `/dashboard/listings/new` avec tous les champs manquants (genre, stock, tags, WhatsApp, livraison).

## Phase 2 — Découverte publique
- Route `/annonces` : grille de cartes premium (image, badge premium, badge vérifié, prix, ville, favori, bouton WhatsApp, quick view au hover).
- Filtres : catégorie, ville, fourchette de prix, premium only, vérifié, tri (récent / populaire / prix).
- Route `/annonces/$id` : galerie zoom, vidéo, profil couturier, avis, produits liés, partage, signaler, favoris, CTA WhatsApp + chat in-app.
- SEO par route : `head()` dynamique, JSON-LD `Product`, sitemap.

## Phase 3 — Premium & boost
- UI choix de durée (1j / 7j / 30j) sur la page annonce.
- Server fn `boostListing` qui met `is_premium=true` + `premium_until`.
- Slider premium en homepage, tri "premium d'abord", glow CSS, label sponsorisé, expiration auto (cron `/api/public/cron/expire-premium`).
- **Paiement** : à confirmer — Stripe ? Wave / Orange Money via redirection ? Pour l'instant je peux poser le flux sans encaissement réel.

## Phase 4 — Mobile & notifications
- UX mobile type Jumia : swipe galerie, FAB WhatsApp sticky, sheet de filtres.
- Notifications in-app (`notifications` table existe) : nouveau message, favori reçu, premium qui expire, annonce approuvée/rejetée.

## Phase 5 — Admin & modération
- Route `/admin` protégée par `has_role(..., 'admin')` : liste des annonces `pending`, boutons approuver / rejeter / mettre en avant / supprimer, vue des transactions premium.

## Phase 6 — IA (Lovable AI Gateway, gratuit)
- À la soumission d'une annonce : `gemini-2.5-flash` → score spam + suggestions de tags + amélioration de description.
- Workflow : suggéré au couturier, jamais appliqué automatiquement.

---

## Questions avant de coder

1. **On commence par quelle phase ?** (recommandation : Phase 1 + 2 ensemble pour avoir un catalogue public utilisable)
2. **Paiement premium** : Stripe maintenant, ou flux "manuel / à brancher plus tard" ?
3. **Modération** : annonces visibles immédiatement (statut `active`) ou file d'attente `pending` à approuver par un admin ?

Réponds par ex. *"Phase 1+2, paiement plus tard, publication immédiate"* et j'implémente dans la foulée.
