CREATE TABLE public.upload_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  folder TEXT,
  file_name TEXT,
  file_size BIGINT,
  content_type TEXT,
  status_code INT,
  error TEXT,
  request_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.upload_failures TO authenticated;
GRANT ALL ON public.upload_failures TO service_role;

ALTER TABLE public.upload_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read upload failures"
  ON public.upload_failures
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_upload_failures_created_at ON public.upload_failures (created_at DESC);
