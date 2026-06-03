
-- shop_media table for gallery (photos & videos)
CREATE TABLE public.shop_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  url text NOT NULL,
  r2_key text,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  caption text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shop_media_shop_pos ON public.shop_media(shop_id, position);

GRANT SELECT ON public.shop_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_media TO authenticated;
GRANT ALL ON public.shop_media TO service_role;

ALTER TABLE public.shop_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_media public read"
  ON public.shop_media FOR SELECT
  USING (true);

CREATE POLICY "shop owner manages media"
  ON public.shop_media FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.couturier_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.couturier_id = auth.uid()));

CREATE POLICY "admins manage shop_media"
  ON public.shop_media FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Self-service: become a couturier (grants role + creates shop)
CREATE OR REPLACE FUNCTION public.become_couturier(_display_name text DEFAULT NULL)
RETURNS public.shops
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _name text;
  _shop public.shops;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (_uid, 'couturier')
  ON CONFLICT (user_id, role) DO NOTHING;

  SELECT * INTO _shop FROM public.shops WHERE couturier_id = _uid;
  IF _shop.id IS NULL THEN
    SELECT COALESCE(NULLIF(trim(_display_name),''), p.display_name, p.full_name, 'atelier')
      INTO _name FROM public.profiles p WHERE p.id = _uid;
    INSERT INTO public.shops (couturier_id, slug, name)
    VALUES (_uid, public.gen_shop_slug(COALESCE(_name,'atelier')), COALESCE(_name,'Mon atelier'))
    RETURNING * INTO _shop;
  END IF;

  RETURN _shop;
END;
$$;

GRANT EXECUTE ON FUNCTION public.become_couturier(text) TO authenticated;
