import { useState } from 'react';
import { Expense } from '@/hooks/useExpenses';
import { Category, getCategoryIcon } from '@/lib/categories';
import { Trash2, Pencil, History } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

import { CategoryRating } from '@/components/CategoryRating';
import { ExpenseHistoryDialog } from '@/components/ExpenseHistoryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  categories?: Category[];
  onRestore?: (
    id: string,
    updates: { description?: string; amount?: number; category_id?: string | null; expense_date?: string }
  ) => Promise<unknown>;
}

export function ExpenseList({ expenses, onDelete, onEdit, categories, onRestore }: ExpenseListProps) {
  const [historyExpense, setHistoryExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nema zabilježenih troškova</p>
        <p className="text-sm mt-1">Dodajte prvi trošak ili skenirajte račun</p>
      </div>
    );
  }

  const historyEnabled = !!categories && !!onRestore;

  return (
    <div className="space-y-2">
      {expenses.map((expense, index) => {
        const IconComponent = expense.category 
          ? getCategoryIcon(expense.category.icon) 
          : null;
        
        return (
          <div
            key={expense.id}
            className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* Category Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: expense.category ? `${expense.category.color}20` : 'hsl(var(--muted))',
                }}
              >
                {IconComponent && (
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: expense.category?.color }}
                  />
                )}
              </div>

              {/* Description & Category */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  {expense.category?.name || 'Bez kategorije'} • {format(new Date(expense.expense_date), 'd. MMM', { locale: hr })}
                </p>
              </div>

              {/* Receipt thumbnail */}
              <ReceiptThumbnail receiptImageUrl={expense.receipt_image_url} />

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="font-bold font-mono text-destructive">
                  -{Number(expense.amount).toFixed(2)} €
                </p>
              </div>

              {/* History button */}
              {historyEnabled && !expense.pending_sync && !expense.id.startsWith('offline_') && (
                <button
                  onClick={() => setHistoryExpense(expense)}
                  title="Povijest izmjena"
                  aria-label="Povijest izmjena"
                  className="md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all"
                >
                  <History className="w-4 h-4" />
                </button>
              )}

              {/* Edit button */}
              <button
                onClick={() => onEdit(expense)}
                aria-label="Uredi trošak"
                className="md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Delete button */}
              <button
                onClick={() => setDeletingExpense(expense)}
                aria-label="Obriši trošak"
                className="md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* AI category rating (samo za skenirane troškove) */}
            <div className="pl-[52px]">
              <CategoryRating expense={expense} onReject={onEdit} />
            </div>
          </div>
        );
      })}

      {historyEnabled && (
        <ExpenseHistoryDialog
          expense={historyExpense}
          categories={categories!}
          open={!!historyExpense}
          onOpenChange={(v) => !v && setHistoryExpense(null)}
          onRestore={onRestore!}
        />
      )}

      <AlertDialog open={!!deletingExpense} onOpenChange={(v) => !v && setDeletingExpense(null)}>
        <AlertDialogContent
          aria-labelledby="delete-expense-title"
          aria-describedby="delete-expense-description"
          className="w-[calc(100vw-2rem)] max-w-md max-h-[90dvh] overflow-y-auto"
        >
          <AlertDialogHeader>
            <AlertDialogTitle id="delete-expense-title">Obrisati trošak?</AlertDialogTitle>
            <AlertDialogDescription id="delete-expense-description" className="break-words">
              {deletingExpense ? (
                <>
                  Jeste li sigurni da želite obrisati <strong>{deletingExpense.description}</strong>
                  {' '}({Number(deletingExpense.amount).toFixed(2)} €)? Ova radnja se ne može poništiti.
                </>
              ) : (
                'Jeste li sigurni?'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus className="min-h-11">Odustani</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingExpense) onDelete(deletingExpense.id);
                setDeletingExpense(null);
              }}
              className="min-h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
