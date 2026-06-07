
-- 1. Hide internal moderation fields on listings from public reads
REVOKE SELECT (ai_spam_score, ai_reviewed_at, rejection_reason) ON public.listings FROM anon, authenticated;

-- 2. Tighten premium_transactions self-insert: require couturier role + listing ownership
DROP POLICY IF EXISTS "Couturier insert own premium tx" ON public.premium_transactions;
CREATE POLICY "Couturier insert own premium tx"
ON public.premium_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = couturier_id
  AND public.has_role(auth.uid(), 'couturier')
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = premium_transactions.listing_id
      AND l.couturier_id = auth.uid()
  )
);

-- 3. Hide shop owner email/phone from anonymous public reads
REVOKE SELECT (email, phone) ON public.shops FROM anon;

-- 4. Allow service_role to purge upload_failures (for automated cleanup)
DROP POLICY IF EXISTS "Service role can delete upload failures" ON public.upload_failures;
CREATE POLICY "Service role can delete upload failures"
ON public.upload_failures
FOR DELETE
TO service_role
USING (true);
