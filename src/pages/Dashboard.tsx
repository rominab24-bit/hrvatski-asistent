import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import { AuthForm } from '@/components/AuthForm';
import { StatCard } from '@/components/StatCard';
import { ExpenseList } from '@/components/ExpenseList';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ReceiptData } from '@/hooks/useReceiptScanner';
import { Button } from '@/components/ui/button';
import { Receipt, Plus, LogOut, Wallet, TrendingDown, PieChart, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { 
    expenses, 
    categories, 
    isLoading, 
    isOnline,
    isSyncing,
    addExpense, 
    deleteExpense, 
    getTotalByCategory, 
    getMonthlyTotal,
    getPendingCount 
  } = useExpenses();
  const [showScanner, setShowScanner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddExpense = async (data: { description: string; amount: number; category_id: string | null }) => {
    await addExpense(data);
    setShowAddForm(false);
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
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
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

        {/* Scanner / Add Form */}
        {showScanner && (
          <ReceiptScanner onScanComplete={handleScanComplete} onCancel={() => setShowScanner(false)} />
        )}
        {showAddForm && (
          <AddExpenseForm categories={categories} onSubmit={handleAddExpense} onCancel={() => setShowAddForm(false)} />
        )}

        {/* Category Breakdown */}
        <section className="glass-card p-4">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary" />
            Troškovi po kategorijama
          </h2>
          <CategoryBreakdown totals={categoryTotals} categories={categories} />
        </section>

        {/* Recent Transactions */}
        <section>
          <h2 className="font-semibold mb-3">Nedavne transakcije</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ExpenseList expenses={expenses.slice(0, 10)} onDelete={deleteExpense} />
          )}
        </section>
      </main>

      {/* Bottom Action Buttons */}
      {!showScanner && !showAddForm && (
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
