-- Add user_id column to expense_categories for custom categories
ALTER TABLE public.expense_categories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for expense_categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.expense_categories;

-- Allow users to read default categories (user_id is null) and their own categories
CREATE POLICY "Users can view default and own categories" 
ON public.expense_categories 
FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);

-- Allow users to create their own categories
CREATE POLICY "Users can create their own categories" 
ON public.expense_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own categories
CREATE POLICY "Users can update their own categories" 
ON public.expense_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own categories
CREATE POLICY "Users can delete their own categories" 
ON public.expense_categories 
FOR DELETE 
USING (auth.uid() = user_id);