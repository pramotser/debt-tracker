-- Migration: populate public.users profile from auth.users.raw_user_meta_data
-- รันใน Supabase SQL Editor
-- รองรับ 2 source ใน trigger เดียว:
--   - Google OAuth: given_name / family_name / name (Google ส่งเอง)
--   - email/password: first_name / middle_name / last_name (signUp options.data)

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  first_n  text := COALESCE(
    meta->>'first_name',
    meta->>'given_name',
    split_part(COALESCE(meta->>'name', ''), ' ', 1),
    ''
  );
  middle_n text := meta->>'middle_name';
  last_n   text := COALESCE(
    meta->>'last_name',
    meta->>'family_name',
    NULLIF(
      substring(COALESCE(meta->>'name', '') FROM position(' ' IN COALESCE(meta->>'name', '')) + 1),
      ''
    ),
    ''
  );
BEGIN
  INSERT INTO public.users (id, first_name, middle_name, last_name)
  VALUES (NEW.id, first_n, middle_n, last_n);
  RETURN NEW;
END;
$$;
