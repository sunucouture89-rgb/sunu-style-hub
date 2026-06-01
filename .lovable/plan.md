# Marketplace multi-vendeurs Sunu Couture

Le projet a déjà : annonces (`listings`), images/vidéos, favoris, conversations, notifications, premium + boost, admin/modération, IA. On va **étendre** cette base au lieu de la reconstruire.

## Phase 1 — Boutiques (Shops)
**Backend**
- Nouvelle table `shops` (un par couturier) : `slug` unique, `name`, `tagline`, `description`, `logo_url`, `cover_url`, `whatsapp`, `phone`, `city`, `country`, `address`, `instagram`, `tiktok`, `facebook`, `is_verified`, `is_active`, `followers_count`, `rating_avg`, `rating_count`.
- Table `shop_followers (shop_id, user_id)`.
- Lier `listings.shop_id` (FK), backfill auto pour les annonces existantes.
- Trigger `handle_new_user` étendu : crée une boutique vide quand le rôle est `couturier`.
- RLS : lecture publique des shops actifs, écriture propriétaire, admin override. GRANT corrects.

**Frontend**
- Route publique `/shop/$slug` : bannière, logo, badge vérifié, stats (produits, followers, note), bouton WhatsApp + Suivre, grille des produits, onglets À propos / Avis.
- Dashboard couturier : nouvel onglet **Ma boutique** (édition logo/cover/desc/réseaux/contact, upload R2 via bucket `listings`).
- Carte boutique réutilisable (sur homepage et résultats annonces).

## Phase 2 — Catalogue produit enrichi
- Étendre `listings` : `sale_price_xof`, `sizes text[]`, `colors text[]`, `sku`, `is_active` (déjà via status).
- Action **dupliquer** une annonce dans le dashboard.
- Catégories : seed des nouvelles (Grand Boubou, Mariage, Broderie, Enfants, Chaussures, Accessoires, Luxe) en complétant `categories`.
- Filtres avancés sur `/annonces` (taille, couleur, prix, livraison).

## Phase 3 — Commandes & ventes
- Étendre `orders` : enum `order_status` (`pending, confirmed, in_production, ready, shipped, delivered, cancelled`), `tracking_number`, `shipping_city`, totaux.
- Table `order_items` (qté, size, color, prix unitaire) — passage multi-lignes.
- Tunnel achat depuis fiche produit (formulaire mesures + adresse).
- Dashboard couturier onglet **Commandes** : liste, détail, transition de statut, notifications auto au client.
- Facture PDF générée côté server fn (HTML→PDF via template simple).

## Phase 4 — Abonnements Shop (Basic/Premium/VIP)
- Table `shop_subscriptions` (`shop_id`, `plan`, `started_at`, `expires_at`, `status`).
- Enum `shop_plan ('basic','premium','vip')`. `basic` = défaut (20 produits max → vérification à l'INSERT via trigger).
- `premium` = produits illimités, badge, visibilité homepage. `vip` = bannière home + classement prioritaire + stats avancées.
- UI : page **Tarifs**, activation manuelle (paiement Wave/Orange Money en hors-ligne pour v1), historique dans dashboard.
- Cron quotidien (réutilise `/api/public/hooks/expire-premium`) pour expirer les plans.

## Phase 5 — Homepage marketplace & social
- Sections : Couturiers à la une (VIP), Boutiques Premium, Derniers produits, Meilleures ventes (à partir des commandes livrées), Top notes.
- Suivre / Se désabonner d'une boutique + notifications nouveaux produits.
- Page **Favoris** consolidée (déjà partielle).

## Phase 6 — Admin étendu & PWA
- Admin : onglets Boutiques (approuver/vérifier/suspendre), Abonnements, Commissions (% configurable, vue revenus).
- Statistiques marketplace globales (GMV, top shops, conversion).
- PWA installable : `manifest.json` + icônes, **sans service worker** (per règle du projet — pas d'offline).

## Stack & règles
- Server functions TanStack (`createServerFn`) — pas d'Edge Functions.
- Stockage : buckets `listings` (déjà public) pour produits/boutiques ; nouveau bucket `shops` si besoin pour logos/covers — sinon sous-dossier `shops/{id}/`.
- RLS strict + GRANTs sur chaque nouvelle table.
- Design system existant (tokens `src/styles.css`), Framer Motion déjà installé.

## Question avant de démarrer
Par quoi commencer ? Je recommande **Phase 1 (Boutiques)** seule dans le prochain tour — c'est le socle qui débloque tout le reste, et c'est déjà ~1 migration + 3 fichiers UI. Les phases suivantes viendront ensuite, une par tour, pour rester contrôlable.
