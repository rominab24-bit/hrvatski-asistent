import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/lib/categories';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  receipt_image_url: string | null;
  receipt_data: any;
  created_at: string;
  expense_date: string;
  category?: Category;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*');

    if (error) {
      console.error('Greška pri dohvaćanju kategorija:', error);
      return;
    }

    setCategories(data || []);
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(*)
      `)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Greška pri dohvaćanju troškova:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće učitati troškove',
        variant: 'destructive',
      });
    } else {
      setExpenses(data || []);
    }
    setIsLoading(false);
  };

  const addExpense = async (expense: {
    description: string;
    amount: number;
    category_id: string | null;
    expense_date?: string;
    receipt_image_url?: string;
    receipt_data?: any;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: 'Greška',
        description: 'Morate biti prijavljeni',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        user_id: user.id,
        expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      })
      .select(`
        *,
        category:expense_categories(*)
      `)
      .single();

    if (error) {
      console.error('Greška pri dodavanju troška:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće dodati trošak',
        variant: 'destructive',
      });
      return null;
    }

    setExpenses(prev => [data, ...prev]);
    toast({
      title: 'Uspjeh',
      description: 'Trošak je uspješno dodan',
    });
    
    return data;
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće obrisati trošak',
        variant: 'destructive',
      });
      return false;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    toast({
      title: 'Uspjeh',
      description: 'Trošak je obrisan',
    });
    return true;
  };

  const getTotalByCategory = () => {
    const totals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Ostalo';
      totals[categoryName] = (totals[categoryName] || 0) + Number(expense.amount);
    });

    return totals;
  };

  const getMonthlyTotal = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter(e => {
        const date = new Date(e.expense_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  return {
    expenses,
    categories,
    isLoading,
    addExpense,
    deleteExpense,
    fetchExpenses,
    getTotalByCategory,
    getMonthlyTotal,
  };
}
