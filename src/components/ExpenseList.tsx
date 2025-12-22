import { Expense } from '@/hooks/useExpenses';
import { getCategoryIcon } from '@/lib/categories';
import { Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nema zabilježenih troškova</p>
        <p className="text-sm mt-1">Dodajte prvi trošak ili skenirajte račun</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense, index) => {
        const IconComponent = expense.category 
          ? getCategoryIcon(expense.category.icon) 
          : null;
        
        return (
          <div 
            key={expense.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Category Icon */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: expense.category ? `${expense.category.color}20` : 'hsl(var(--muted))' 
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

            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="font-bold font-mono text-destructive">
                -{Number(expense.amount).toFixed(2)} €
              </p>
            </div>

            {/* Edit button */}
            <button
              onClick={() => onEdit(expense)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={() => onDelete(expense.id)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
