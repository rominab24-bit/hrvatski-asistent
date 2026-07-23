-- Ukloni sve storage policies za 'receipts' bucket — bez policy-ja nijedan
-- prijavljeni/anon korisnik ne može čitati, uploadati, mijenjati ni brisati
-- datoteke. (service_role zaobilazi RLS, koristi se samo pri brisanju računa.)
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

-- Očisti postojeće reference na slike u bazi, tako da aplikacija ne pokušava
-- generirati signed URL za više nepristupačne datoteke.
UPDATE public.expenses SET receipt_image_url = NULL WHERE receipt_image_url IS NOT NULL;
UPDATE public.expense_versions SET receipt_image_url = NULL WHERE receipt_image_url IS NOT NULL;