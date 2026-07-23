
-- 1) ai_scan_usage: add explicit deny policies for anon/authenticated (service_role bypasses RLS)
CREATE POLICY "Deny anon access to ai_scan_usage"
  ON public.ai_scan_usage FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny authenticated access to ai_scan_usage"
  ON public.ai_scan_usage FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- 2) Set search_path on functions missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;

-- 3) Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions that should not be public
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_expense_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_scan_month() FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains execute
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_scan_month() TO service_role;

-- get_scan_usage is called by signed-in clients via supabase.rpc — keep authenticated access, revoke anon
REVOKE EXECUTE ON FUNCTION public.get_scan_usage(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_scan_usage(integer) TO authenticated, service_role;
