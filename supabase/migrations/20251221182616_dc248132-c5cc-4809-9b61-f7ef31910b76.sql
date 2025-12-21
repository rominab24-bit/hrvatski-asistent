-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Categories are readable by everyone (public reference data)
CREATE POLICY "Categories are publicly readable" 
ON public.expense_categories 
FOR SELECT 
USING (true);

-- Insert default Croatian expense categories
INSERT INTO public.expense_categories (name, icon, color) VALUES
  ('Hrana', 'shopping-cart', '#10B981'),
  ('Kućanstvo', 'home', '#3B82F6'),
  ('Prijevoz', 'car', '#F59E0B'),
  ('Zdravlje', 'heart', '#EF4444'),
  ('Zabava', 'gamepad-2', '#8B5CF6'),
  ('Odjeća', 'shirt', '#EC4899'),
  ('Obrazovanje', 'book-open', '#06B6D4'),
  ('Računi', 'zap', '#F97316'),
  ('Ostalo', 'more-horizontal', '#6B7280');

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  receipt_image_url TEXT,
  receipt_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view their own expenses
CREATE POLICY "Users can view their own expenses" 
ON public.expenses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own expenses
CREATE POLICY "Users can create their own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own expenses
CREATE POLICY "Users can update their own expenses" 
ON public.expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own expenses
CREATE POLICY "Users can delete their own expenses" 
ON public.expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policies for receipts
CREATE POLICY "Receipt images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts');

CREATE POLICY "Users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);