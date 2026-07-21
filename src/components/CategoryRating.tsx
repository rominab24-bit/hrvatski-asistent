import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Expense } from '@/hooks/useExpenses';
import {
  getExpenseRating,
  recordCategoryFeedback,
  setExpenseRating,
} from '@/lib/categoryFeedback';

interface CategoryRatingProps {
  expense: Expense;
  /** Poziva se kad korisnik označi "netočno" — obično otvara EditExpenseForm. */
  onReject: (expense: Expense) => void;
}

/**
 * Male gumbe "točno / netočno" prikazane na svakom trošku sa skeniranog računa.
 * - "Točno" bilježi jaku pozitivnu povratnu informaciju (weight=3) i pojačava
 *   kategoriju za sličan izdavatelj/stavku pri budućim skeniranjima.
 * - "Netočno" otvara uređivanje troška; kad korisnik promijeni kategoriju,
 *   `updateExpense` automatski bilježi ispravku (weight=1).
 * Status ocjene se pamti lokalno pa se nakon ocjene prikazuje samo oznaka.
 */
export function CategoryRating({ expense, onReject }: CategoryRatingProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState(() => getExpenseRating(expense.id));

  // Prikaži samo za troškove sa skeniranog računa i s odabranom kategorijom.
  if (!expense.receipt_data || !expense.category?.name) return null;
  if (expense.id.startsWith('offline_')) return null;

  if (status === 'confirmed') {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-success">
        <Check className="w-3 h-3" />
        <span>Ocijenjeno kao točno</span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>Ocijenjeno kao netočno</span>
      </div>
    );
  }

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const storeName = (expense.receipt_data as any)?.store_name ?? null;
    await recordCategoryFeedback({
      storeName,
      itemName: expense.description,
      originalCategory: expense.category?.name ?? null,
      correctedCategory: expense.category!.name,
      weight: 3,
    });
    setExpenseRating(expense.id, 'confirmed');
    setStatus('confirmed');
    toast({
      title: 'Hvala na potvrdi!',
      description: 'AI će ubuduće još sigurnije predložiti ovu kategoriju.',
    });
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpenseRating(expense.id, 'rejected');
    setStatus('rejected');
    onReject(expense);
  };

  return (
    <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
      <span className="mr-1">Je li kategorija točna?</span>
      <button
        type="button"
        onClick={handleConfirm}
        aria-label="Označi kao točno"
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md',
          'hover:bg-success/15 hover:text-success transition-colors'
        )}
      >
        <ThumbsUp className="w-3 h-3" />
        <span>Točno</span>
      </button>
      <button
        type="button"
        onClick={handleReject}
        aria-label="Označi kao netočno"
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md',
          'hover:bg-destructive/15 hover:text-destructive transition-colors'
        )}
      >
        <ThumbsDown className="w-3 h-3" />
        <span>Netočno</span>
      </button>
    </div>
  );
}
