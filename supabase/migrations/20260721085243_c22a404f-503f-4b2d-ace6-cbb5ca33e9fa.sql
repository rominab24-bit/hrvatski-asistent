INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Voda', 'droplet', '#3B82F6'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Voda')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Struja', 'zap', '#F59E0B'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Struja')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Grijanje', 'flame', '#EF4444'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Grijanje')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Pričuva TV', 'tv', '#8B5CF6'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Pričuva TV')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Smeće', 'trash-2', '#6B7280'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Smeće')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Komunalna naknada', 'building-2', '#10B981'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Komunalna naknada')
);

INSERT INTO public.expense_categories (name, icon, color)
SELECT 'Kućni internet', 'wifi', '#06B6D4'
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories WHERE lower(name) = lower('Kućni internet')
);
