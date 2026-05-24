-- Extend listing_status enum
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'rejected';

-- Moderation + AI fields
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS ai_spam_score numeric,
  ADD COLUMN IF NOT EXISTS ai_reviewed_at timestamptz;

-- Premium transactions table
CREATE TABLE IF NOT EXISTS public.premium_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  couturier_id uuid NOT NULL,
  duration_days integer NOT NULL,
  amount_xof integer NOT NULL,
  payment_method text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couturier sees own premium tx"
ON public.premium_transactions FOR SELECT
USING (auth.uid() = couturier_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Couturier insert own premium tx"
ON public.premium_transactions FOR INSERT
WITH CHECK (auth.uid() = couturier_id);

CREATE POLICY "Admin manage premium tx"
ON public.premium_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_premium_tx_couturier ON public.premium_transactions(couturier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status_premium ON public.listings(status, is_premium, created_at DESC);