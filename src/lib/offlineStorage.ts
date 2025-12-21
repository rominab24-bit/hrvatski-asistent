const EXPENSES_KEY = 'offline_expenses';
const PENDING_SYNC_KEY = 'pending_sync_expenses';

export interface OfflineExpense {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  expense_date: string;
  user_id: string;
  created_at: string;
  receipt_data?: unknown;
  receipt_image_url?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  pending_sync?: boolean;
}

// Save expenses to local storage
export function saveExpensesLocally(expenses: OfflineExpense[]) {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving expenses locally:', error);
  }
}

// Get expenses from local storage
export function getLocalExpenses(): OfflineExpense[] {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading local expenses:', error);
    return [];
  }
}

// Add expense to pending sync queue
export function addToPendingSync(expense: OfflineExpense) {
  try {
    const pending = getPendingSyncExpenses();
    pending.push({ ...expense, pending_sync: true });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    
    // Also add to local expenses for display
    const localExpenses = getLocalExpenses();
    localExpenses.unshift({ ...expense, pending_sync: true });
    saveExpensesLocally(localExpenses);
  } catch (error) {
    console.error('Error adding to pending sync:', error);
  }
}

// Get pending sync expenses
export function getPendingSyncExpenses(): OfflineExpense[] {
  try {
    const data = localStorage.getItem(PENDING_SYNC_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading pending sync:', error);
    return [];
  }
}

// Clear pending sync queue
export function clearPendingSync() {
  try {
    localStorage.removeItem(PENDING_SYNC_KEY);
  } catch (error) {
    console.error('Error clearing pending sync:', error);
  }
}

// Remove specific expense from pending sync
export function removeFromPendingSync(expenseId: string) {
  try {
    const pending = getPendingSyncExpenses();
    const filtered = pending.filter(e => e.id !== expenseId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from pending sync:', error);
  }
}

// Clear all local data
export function clearLocalData() {
  try {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(PENDING_SYNC_KEY);
  } catch (error) {
    console.error('Error clearing local data:', error);
  }
}
