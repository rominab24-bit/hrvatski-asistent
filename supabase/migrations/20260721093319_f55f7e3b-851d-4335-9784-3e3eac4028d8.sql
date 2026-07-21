
CREATE TABLE public.expense_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL,
  user_id UUID NOT NULL,
  description TEXT,
  amount NUMERIC,
  category_id UUID,
  expense_date DATE,
  receipt_image_url TEXT,
  receipt_data JSONB,
  change_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.expense_versions TO authenticated;
GRANT ALL ON public.expense_versions TO service_role;

ALTER TABLE public.expense_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expense versions"
  ON public.expense_versions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense versions"
  ON public.expense_versions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_expense_versions_expense_id ON public.expense_versions(expense_id, created_at DESC);
CREATE INDEX idx_expense_versions_user_id ON public.expense_versions(user_id);

CREATE OR REPLACE FUNCTION public.snapshot_expense_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.expense_versions (
    expense_id, user_id, description, amount, category_id,
    expense_date, receipt_image_url, receipt_data, change_type
  ) VALUES (
    OLD.id, OLD.user_id, OLD.description, OLD.amount, OLD.category_id,
    OLD.expense_date, OLD.receipt_image_url, OLD.receipt_data,
    CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'update' END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER expenses_snapshot_on_update
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  WHEN (
    OLD.description IS DISTINCT FROM NEW.description
    OR OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.category_id IS DISTINCT FROM NEW.category_id
    OR OLD.expense_date IS DISTINCT FROM NEW.expense_date
  )
  EXECUTE FUNCTION public.snapshot_expense_version();
