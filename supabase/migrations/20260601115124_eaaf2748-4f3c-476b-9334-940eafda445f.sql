
-- 1) profiles: hide phone from the public; keep whatsapp_number public (used as business CTA)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profile fields viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;
GRANT SELECT (phone) ON public.profiles TO service_role;

CREATE POLICY "Owner can read own phone"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2) notifications: only service_role can insert
DROP POLICY IF EXISTS "Service insert notifications" ON public.notifications;

CREATE POLICY "Service role inserts notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- 3) user_roles: remove self-serve insert (handled by handle_new_user trigger)
DROP POLICY IF EXISTS "Users can self-assign client/couturier on signup" ON public.user_roles;

-- 4) storage policies — avatars DELETE; chat DELETE + UPDATE
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own chat files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5) Fix mutable search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin new.updated_at = now(); return new; end;
$function$;

-- 6) Restrict EXECUTE on SECURITY DEFINER helpers
-- handle_new_user: only triggered by auth schema, no direct callers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- bump_conversation: trigger function, no direct callers
REVOKE EXECUTE ON FUNCTION public.bump_conversation() FROM PUBLIC, anon, authenticated;
-- has_role: called from RLS policies (postgres evaluates as definer) — keep accessible to authenticated for app code that checks own roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
