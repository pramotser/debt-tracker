-- Migration: lock down handle_new_auth_user() from REST RPC exposure
-- รันใน Supabase SQL Editor
--
-- Why: SECURITY DEFINER + default GRANT EXECUTE TO PUBLIC ทำให้ /rest/v1/rpc/handle_new_auth_user
-- เรียกได้จาก anon / authenticated role → bypass auth flow
-- Trigger ยังทำงานปกติ: trigger fire ไม่เช็ค EXECUTE privilege ของ caller

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM authenticated;
