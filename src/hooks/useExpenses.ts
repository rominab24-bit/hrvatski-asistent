import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/lib/categories';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { 
  saveExpensesLocally, 
  getLocalExpenses, 
  addToPendingSync, 
  getPendingSyncExpenses,
  removeFromPendingSync,
  OfflineExpense 
} from '@/lib/offlineStorage';

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
  pending_sync?: boolean;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const isOnline = useOnlineStatus();

  // Sync pending expenses when coming back online
  const syncPendingExpenses = useCallback(async () => {
    const pending = getPendingSyncExpenses();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;

    for (const expense of pending) {
      try {
        const { error } = await supabase
          .from('expenses')
          .insert([{
            description: expense.description,
            amount: expense.amount,
            category_id: expense.category_id,
            expense_date: expense.expense_date,
            user_id: expense.user_id,
            receipt_data: expense.receipt_data as any,
            receipt_image_url: expense.receipt_image_url,
          }]);

        if (!error) {
          removeFromPendingSync(expense.id);
          syncedCount++;
        }
      } catch (error) {
        console.error('Error syncing expense:', error);
      }
    }

    if (syncedCount > 0) {
      toast({
        title: 'Sinkronizacija završena',
        description: `${syncedCount} trošak(a) uspješno sinkronizirano`,
      });
      // Refresh expenses from server
      fetchExpenses();
    }

    setIsSyncing(false);
  }, [toast]);

  // Watch for online status changes
  useEffect(() => {
    if (isOnline) {
      syncPendingExpenses();
    }
  }, [isOnline, syncPendingExpenses]);

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const fetchCategories = async () => {
    // Try to get from server first
    if (isOnline) {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (!error && data) {
        setCategories(data);
        // Cache categories locally
        try {
          localStorage.setItem('offline_categories', JSON.stringify(data));
        } catch (e) {
          console.error('Error caching categories:', e);
        }
        return;
      }
    }

    // Fallback to cached categories
    try {
      const cached = localStorage.getItem('offline_categories');
      if (cached) {
        setCategories(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Error reading cached categories:', e);
    }
  };

  const addCategory = async (category: { name: string; icon: string; color: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: 'Greška',
        description: 'Morate biti prijavljeni',
        variant: 'destructive',
      });
      return null;
    }

    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Dodavanje kategorija nije moguće bez internet veze',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        name: category.name,
        icon: category.icon,
        color: category.color,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Greška pri dodavanju kategorije:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće dodati kategoriju',
        variant: 'destructive',
      });
      return null;
    }

    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    
    toast({
      title: 'Uspjeh',
      description: 'Kategorija je uspješno dodana',
    });

    return data;
  };

  const deleteCategory = async (id: string) => {
    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Brisanje kategorija nije moguće bez internet veze',
        variant: 'destructive',
      });
      return false;
    }

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Greška pri brisanju kategorije:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće obrisati kategoriju',
        variant: 'destructive',
      });
      return false;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    
    toast({
      title: 'Uspjeh',
      description: 'Kategorija je obrisana',
    });

    return true;
  };

  const fetchExpenses = async () => {
    setIsLoading(true);

    if (isOnline) {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .order('expense_date', { ascending: false });

      if (!error && data) {
        // Merge with pending sync items
        const pending = getPendingSyncExpenses();
        const mergedExpenses = [...pending.filter(p => p.pending_sync), ...data];
        setExpenses(mergedExpenses as Expense[]);
        // Cache for offline use
        saveExpensesLocally(data as OfflineExpense[]);
      } else {
        console.error('Greška pri dohvaćanju troškova:', error);
        // Fallback to local data
        const localData = getLocalExpenses();
        setExpenses(localData as Expense[]);
        toast({
          title: 'Offline način',
          description: 'Prikazuju se lokalno spremljeni podaci',
        });
      }
    } else {
      // Offline - use local data
      const localData = getLocalExpenses();
      setExpenses(localData as Expense[]);
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

    const expenseDate = expense.expense_date || new Date().toISOString().split('T')[0];
    const category = categories.find(c => c.id === expense.category_id);

    if (isOnline) {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          user_id: user.id,
          expense_date: expenseDate,
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
      // Update local cache
      const localExpenses = getLocalExpenses();
      saveExpensesLocally([data as OfflineExpense, ...localExpenses]);
      
      toast({
        title: 'Uspjeh',
        description: 'Trošak je uspješno dodan',
      });
      
      return data;
    } else {
      // Offline - save locally and queue for sync
      const offlineExpense: OfflineExpense = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: expense.description,
        amount: expense.amount,
        category_id: expense.category_id,
        expense_date: expenseDate,
        user_id: user.id,
        created_at: new Date().toISOString(),
        receipt_data: expense.receipt_data,
        receipt_image_url: expense.receipt_image_url || null,
        category: category ? {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        } : null,
        pending_sync: true,
      };

      addToPendingSync(offlineExpense);
      setExpenses(prev => [offlineExpense as Expense, ...prev]);

      toast({
        title: 'Spremljeno lokalno',
        description: 'Trošak će se sinkronizirati kad budete online',
      });

      return offlineExpense as Expense;
    }
  };

  const updateExpense = async (
    id: string,
    updates: {
      description?: string;
      amount?: number;
      category_id?: string | null;
      expense_date?: string;
    }
  ) => {
    // Cannot update offline expenses
    if (id.startsWith('offline_')) {
      toast({
        title: 'Offline',
        description: 'Uređivanje offline troškova nije moguće',
        variant: 'destructive',
      });
      return null;
    }

    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Uređivanje nije moguće bez internet veze',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:expense_categories(*)
      `)
      .single();

    if (error) {
      console.error('Greška pri uređivanju troška:', error);
      toast({
        title: 'Greška',
        description: 'Nije moguće urediti trošak',
        variant: 'destructive',
      });
      return null;
    }

    setExpenses(prev => prev.map(e => (e.id === id ? data : e)));
    // Update local cache
    const localExpenses = getLocalExpenses().map(e => (e.id === id ? data as OfflineExpense : e));
    saveExpensesLocally(localExpenses);

    toast({
      title: 'Uspjeh',
      description: 'Trošak je uspješno ažuriran',
    });

    return data;
  };

  const deleteExpense = async (id: string) => {
    // Check if it's an offline expense
    if (id.startsWith('offline_')) {
      removeFromPendingSync(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({
        title: 'Uspjeh',
        description: 'Trošak je obrisan',
      });
      return true;
    }

    if (!isOnline) {
      toast({
        title: 'Offline',
        description: 'Brisanje nije moguće bez internet veze',
        variant: 'destructive',
      });
      return false;
    }

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
    // Update local cache
    const localExpenses = getLocalExpenses().filter(e => e.id !== id);
    saveExpensesLocally(localExpenses);

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

  const getPendingCount = () => {
    return expenses.filter(e => e.pending_sync).length;
  };

  return {
    expenses,
    categories,
    isLoading,
    isOnline,
    isSyncing,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    deleteCategory,
    fetchExpenses,
    getTotalByCategory,
    getMonthlyTotal,
    getPendingCount,
    syncPendingExpenses,
  };
}
