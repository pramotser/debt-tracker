-- Migration: integrate with Supabase Auth
-- รันใน Supabase SQL Editor (ต้องมี superuser ถึงจะแตะ auth schema ได้)
-- ⚠️ destructive: ลบ dev seed user + cascade ลบ data ที่ผูก

-- 1. ลบ dev seed user (CASCADE → ล้าง user_settings, fixed_cost_templates,
--    subscription_templates, credit_cards, credit_card_installments, ledger_entries)
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. enum user_role + column users.role
CREATE TYPE user_role AS ENUM ('admin', 'user');
ALTER TABLE public.users ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- 3. default '' สำหรับ first_name / last_name (รองรับ trigger ที่ insert ว่าง)
ALTER TABLE public.users ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN last_name SET DEFAULT '';

-- 4. FK ไป auth.users (ON DELETE CASCADE → ลบ auth = ลบ profile + data ทั้งหมด)
ALTER TABLE public.users
  ADD CONSTRAINT users_id_auth_fkey FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Trigger auto-create public.users เมื่อ auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name)
  VALUES (NEW.id, '', '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
