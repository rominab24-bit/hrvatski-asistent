-- Add hygiene category for personal care products
-- This is intentionally a new migration so existing databases can receive the category too.

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Higijena', 'sparkles', '#14B8A6'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Higijena')
);
