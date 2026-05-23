
-- 1. Extend listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS delivery_available boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS listings_discovery_idx
  ON public.listings (status, is_premium DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_category_idx ON public.listings (category);
CREATE INDEX IF NOT EXISTS listings_city_idx ON public.listings (city);

-- 2. ad_videos
CREATE TABLE IF NOT EXISTS public.ad_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  poster_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ad videos public" ON public.ad_videos;
CREATE POLICY "Ad videos public" ON public.ad_videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner manages ad videos" ON public.ad_videos;
CREATE POLICY "Owner manages ad videos" ON public.ad_videos FOR ALL
USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = ad_videos.listing_id AND l.couturier_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = ad_videos.listing_id AND l.couturier_id = auth.uid()));

CREATE INDEX IF NOT EXISTS ad_videos_listing_idx ON public.ad_videos (listing_id, position);

-- 3. categories
CREATE TABLE IF NOT EXISTS public.categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  emoji text
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories public" ON public.categories;
CREATE POLICY "Categories public" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories (slug, label, position, emoji) VALUES
  ('boubou-homme',     'Boubou Homme',       1, '👳🏿'),
  ('boubou-femme',     'Boubou Femme',       2, '👗'),
  ('grand-boubou',     'Grand Boubou',       3, '🧥'),
  ('robes-africaines', 'Robes africaines',   4, '👘'),
  ('mariage',          'Mariage',            5, '💍'),
  ('broderie',         'Broderie',           6, '🪡'),
  ('enfants',          'Enfants',            7, '🧒🏿'),
  ('chaussures',       'Chaussures',         8, '👞'),
  ('accessoires',      'Accessoires',        9, '👜'),
  ('luxe',             'Mode de luxe',      10, '💎')
ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, position = EXCLUDED.position, emoji = EXCLUDED.emoji;
