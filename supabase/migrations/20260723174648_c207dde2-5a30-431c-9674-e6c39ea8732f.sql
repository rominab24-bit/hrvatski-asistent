
-- 1) Revoke EXECUTE from authenticated/anon on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_user_scan_usage(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_scan_usage(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_scan_usage(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_user_scan_usage(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
-- Keep get_my_scan_usage callable — it is scoped to auth.uid() and used by the client.

-- 2) Storage policies for receipts bucket (owner folder scheme: {auth.uid()}/...)
DROP POLICY IF EXISTS "Users can read own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;

CREATE POLICY "Users can read own receipts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own receipts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3) Replace ALL policy on category_feedback with explicit per-command policies
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='category_feedback' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.category_feedback', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "cf_select_own" ON public.category_feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "cf_insert_own" ON public.category_feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cf_update_own" ON public.category_feedback FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cf_delete_own" ON public.category_feedback FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4) Tighten expense_categories: explicitly protect default (user_id IS NULL) rows
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='expense_categories' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.expense_categories', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "ec_select_defaults_and_own" ON public.expense_categories FOR SELECT TO authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "ec_insert_own" ON public.expense_categories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "ec_update_own_not_defaults" ON public.expense_categories FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "ec_delete_own_not_defaults" ON public.expense_categories FOR DELETE TO authenticated
USING (auth.uid() = user_id AND user_id IS NOT NULL);
