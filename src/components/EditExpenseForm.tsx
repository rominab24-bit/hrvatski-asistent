import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Category, getCategoryIcon } from '@/lib/categories';
import { Save, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Expense } from '@/hooks/useExpenses';

interface EditExpenseFormProps {
  expense: Expense;
  categories: Category[];
  onSubmit: (id: string, data: { description: string; amount: number; category_id: string | null; expense_date: string }) => void;
  onCancel: () => void;
}

export function EditExpenseForm({ expense, categories, onSubmit, onCancel }: EditExpenseFormProps) {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(expense.category_id);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(expense.expense_date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onSubmit(expense.id, {
      description,
      amount: parseFloat(amount),
      category_id: selectedCategory,
      expense_date: format(selectedDate, 'yyyy-MM-dd'),
    });
  };

  return (
    <Card className="p-6 glass-card animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Uredi trošak</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Opis</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="npr. Konzum, gorivo, struja..."
            className="bg-secondary border-border"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Iznos (€)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-secondary border-border font-mono"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Datum</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-secondary border-border",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "d. MMMM yyyy", { locale: hr }) : <span>Odaberi datum</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                initialFocus
                locale={hr}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Kategorija</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon);
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                  className={`
                    p-3 rounded-lg flex flex-col items-center gap-1 transition-all text-xs
                    ${isSelected 
                      ? 'ring-2 ring-primary bg-primary/10' 
                      : 'bg-secondary hover:bg-secondary/80'
                    }
                  `}
                >
                  <IconComponent 
                    className="w-5 h-5" 
                    style={{ color: category.color }} 
                  />
                  <span className="truncate w-full text-center">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Spremi promjene
        </Button>
      </form>
    </Card>
  );
}
