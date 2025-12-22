import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { AuthForm } from '@/components/AuthForm';
import { StatCard } from '@/components/StatCard';
import { ExpenseList } from '@/components/ExpenseList';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { EditExpenseForm } from '@/components/EditExpenseForm';
import { AddCategoryForm } from '@/components/AddCategoryForm';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ExportDialog } from '@/components/ExportDialog';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { ReceiptData } from '@/hooks/useReceiptScanner';
import { Button } from '@/components/ui/button';
import { Receipt, Plus, LogOut, Wallet, TrendingDown, PieChart, Loader2, BarChart3, Filter, Tags } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { 
    expenses, 
    categories, 
    isLoading, 
    isOnline,
    isSyncing,
    addExpense, 
    updateExpense,
    deleteExpense, 
    addCategory,
    getTotalByCategory, 
    getMonthlyTotal,
    getPendingCount 
  } = useExpenses();
  const [showScanner, setShowScanner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return expenses;
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      if (filterStartDate && expenseDate < filterStartDate) return false;
      if (filterEndDate && expenseDate > filterEndDate) return false;
      return true;
    });
  }, [expenses, filterStartDate, filterEndDate]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setFilterStartDate(start);
    setFilterEndDate(end);
  };

  const hasDateFilter = filterStartDate || filterEndDate;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const monthlyTotal = getMonthlyTotal();
  const categoryTotals = getTotalByCategory();
  const transactionCount = expenses.length;

  const handleScanComplete = async (data: ReceiptData) => {
    for (const item of data.items) {
      const category = categories.find(c => c.name === item.category);
      await addExpense({
        description: item.name,
        amount: item.price,
        category_id: category?.id || null,
        receipt_data: data,
      });
    }
    setShowScanner(false);
  };

  const handleAddExpense = async (data: { description: string; amount: number; category_id: string | null; expense_date: string }) => {
    await addExpense(data);
    setShowAddForm(false);
  };

  const handleEditExpense = async (id: string, data: { description: string; amount: number; category_id: string | null; expense_date: string }) => {
    await updateExpense(id, data);
    setEditingExpense(null);
  };

  const handleStartEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddForm(false);
    setShowScanner(false);
    setShowAddCategoryForm(false);
  };

  const handleAddCategory = async (data: { name: string; icon: string; color: string }) => {
    await addCategory(data);
    setShowAddCategoryForm(false);
  };

  return (
    <>
      <OfflineIndicator pendingCount={getPendingCount()} isSyncing={isSyncing} />
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Kućni Budžet</h1>
            <p className="text-xs text-muted-foreground">Dobrodošli natrag!</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ExportDialog expenses={expenses} categories={categories} monthlyTotal={monthlyTotal} />
          <Button variant="ghost" size="icon" onClick={() => navigate('/statistics')}>
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Ovaj mjesec"
            value={`${monthlyTotal.toFixed(2)} €`}
            icon={<Wallet className="w-5 h-5 text-primary" />}
          />
          <StatCard
            title="Transakcije"
            value={transactionCount.toString()}
            icon={<TrendingDown className="w-5 h-5 text-warning" />}
          />
        </div>

        {/* Scanner / Add Form / Edit Form */}
        {showScanner && (
          <ReceiptScanner onScanComplete={handleScanComplete} onCancel={() => setShowScanner(false)} />
        )}
        {showAddForm && (
          <AddExpenseForm categories={categories} onSubmit={handleAddExpense} onCancel={() => setShowAddForm(false)} />
        )}
        {editingExpense && (
          <EditExpenseForm 
            expense={editingExpense} 
            categories={categories} 
            onSubmit={handleEditExpense} 
            onCancel={() => setEditingExpense(null)} 
          />
        )}
        {showAddCategoryForm && (
          <AddCategoryForm 
            onSubmit={handleAddCategory} 
            onCancel={() => setShowAddCategoryForm(false)} 
          />
        )}

        {/* Category Breakdown */}
        <section className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Troškovi po kategorijama
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddCategoryForm(true);
                setShowAddForm(false);
                setShowScanner(false);
                setEditingExpense(null);
              }}
            >
              <Tags className="w-4 h-4 mr-1" />
              <span className="text-xs">Nova</span>
            </Button>
          </div>
          <CategoryBreakdown totals={categoryTotals} categories={categories} />
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {hasDateFilter ? 'Filtrirane transakcije' : 'Nedavne transakcije'}
              {hasDateFilter && <span className="text-xs text-muted-foreground ml-2">({filteredExpenses.length})</span>}
            </h2>
            <Button
              variant={showDateFilter ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={hasDateFilter ? "text-primary" : ""}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          {showDateFilter && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/50">
              <DateRangeFilter
                startDate={filterStartDate}
                endDate={filterEndDate}
                onRangeChange={handleDateRangeChange}
              />
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ExpenseList 
              expenses={hasDateFilter ? filteredExpenses : filteredExpenses.slice(0, 10)} 
              onDelete={deleteExpense} 
              onEdit={handleStartEdit} 
            />
          )}
        </section>
      </main>

      {/* Bottom Action Buttons */}
      {!showScanner && !showAddForm && !editingExpense && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="flex gap-3 max-w-md mx-auto">
            <Button onClick={() => setShowAddForm(true)} variant="secondary" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Ručno
            </Button>
            <Button onClick={() => setShowScanner(true)} className="flex-1 glow-effect">
              <Receipt className="w-4 h-4 mr-2" />
              Skeniraj račun
            </Button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
