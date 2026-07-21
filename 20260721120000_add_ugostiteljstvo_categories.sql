-- Odvojene kategorije za ugostiteljstvo, da potrošnja u kafiću i restoranu
-- više ne završava u kategoriji "Hrana" (koja je za namirnice iz trgovine).
-- Idempotentno: postojeće baze također dobiju kategorije, bez duplikata.

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Kafići i barovi', 'coffee', '#A16207'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Kafići i barovi')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Restorani', 'utensils', '#DC2626'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Restorani')
);
