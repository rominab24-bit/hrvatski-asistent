import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import { AuthForm } from '@/components/AuthForm';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Statistics() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    expenses, 
    categories, 
    isLoading,
    isSyncing,
    getPendingCount 
  } = useExpenses();

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

  return (
    <>
      <OfflineIndicator pendingCount={getPendingCount()} isSyncing={isSyncing} />
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <header className="p-4 flex items-center gap-3 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Statistike</h1>
              <p className="text-xs text-muted-foreground">Pregled troškova kroz vrijeme</p>
            </div>
          </div>
        </header>

        <main className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nema podataka za prikaz</p>
              <p className="text-sm">Dodajte troškove da biste vidjeli statistike</p>
            </div>
          ) : (
            <ExpenseCharts expenses={expenses} categories={categories} />
          )}
        </main>
      </div>
    </>
  );
}
