-- Tablica za pohranu korisničkih ispravki kategorija sa skeniranih računa.
-- AI koristi ove podatke kao dodatne upute pri sljedećem skeniranju sličnih računa
-- (isti izdavatelj / slična stavka), kako bi bolje pogađao kategoriju.

CREATE TABLE public.category_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT,
  item_name TEXT NOT NULL,
  original_category TEXT,
  corrected_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_feedback TO authenticated;
GRANT ALL ON public.category_feedback TO service_role;

ALTER TABLE public.category_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own category feedback"
  ON public.category_feedback
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_category_feedback_user_store
  ON public.category_feedback (user_id, lower(store_name), created_at DESC);

CREATE INDEX idx_category_feedback_user_item
  ON public.category_feedback (user_id, lower(item_name), created_at DESC);
