-- 1) Make receipts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- 2) Drop any existing overly-permissive policies on storage.objects for receipts
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (qual ILIKE '%receipts%' OR with_check ILIKE '%receipts%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 3) Owner-scoped policies (file path must start with the user's UID folder)
CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);