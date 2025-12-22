import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses, Expense } from '@/hooks/useExpenses';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { AuthForm } from '@/components/AuthForm';
import { ExpenseList } from '@/components/ExpenseList';
import { EditExpenseForm } from '@/components/EditExpenseForm';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, X, Filter, Loader2, Receipt } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function Transactions() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    expenses, 
    categories, 
    isLoading, 
    deleteExpense, 
    updateExpense 
  } = useExpenses();
  const { playSuccess, playDelete, playClick, playNotification } = useSoundEffects();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    
    // Filter by date range
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        if (filterStartDate && expenseDate < filterStartDate) return false;
        if (filterEndDate && expenseDate > filterEndDate) return false;
        return true;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(query) ||
        expense.category?.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [expenses, filterStartDate, filterEndDate, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterStartDate, filterEndDate, searchQuery]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setFilterStartDate(start);
    setFilterEndDate(end);
  };

  const handleEditExpense = async (id: string, data: { description: string; amount: number; category_id: string | null; expense_date: string }) => {
    await updateExpense(id, data);
    setEditingExpense(null);
    playNotification();
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    playDelete();
  };

  const handleStartEdit = (expense: Expense) => {
    setEditingExpense(expense);
    playClick();
  };

  const hasDateFilter = filterStartDate || filterEndDate;
  const hasSearchFilter = searchQuery.trim().length > 0;
  const hasAnyFilter = hasDateFilter || hasSearchFilter;

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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="p-4 flex items-center gap-3 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Sve transakcije</h1>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} ukupno</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Edit Form */}
        {editingExpense && (
          <EditExpenseForm 
            expense={editingExpense} 
            categories={categories} 
            onSubmit={handleEditExpense} 
            onCancel={() => setEditingExpense(null)} 
          />
        )}

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pretraži po opisu ili kategoriji..."
              className="pl-9 pr-9 bg-secondary border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant={showDateFilter ? "default" : "secondary"}
            size="icon"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={hasDateFilter ? "text-primary" : ""}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Date Filter */}
        {showDateFilter && (
          <div className="p-3 rounded-lg bg-secondary/50">
            <DateRangeFilter
              startDate={filterStartDate}
              endDate={filterEndDate}
              onRangeChange={handleDateRangeChange}
            />
          </div>
        )}

        {/* Clear Filters */}
        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setFilterStartDate(null);
              setFilterEndDate(null);
            }}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Očisti filtere
          </Button>
        )}

        {/* Expense List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ExpenseList 
            expenses={paginatedExpenses} 
            onDelete={handleDeleteExpense} 
            onEdit={handleStartEdit} 
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prethodna
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sljedeća
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
