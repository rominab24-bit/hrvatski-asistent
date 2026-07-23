INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Frizer', 'scissors', '#EC4899'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Frizer'));

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Automehaničar', 'wrench', '#F59E0B'
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Automehaničar'));