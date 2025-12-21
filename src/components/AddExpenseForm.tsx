import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Category, getCategoryIcon } from '@/lib/categories';
import { Plus, X } from 'lucide-react';

interface AddExpenseFormProps {
  categories: Category[];
  onSubmit: (data: { description: string; amount: number; category_id: string | null }) => void;
  onCancel: () => void;
}

export function AddExpenseForm({ categories, onSubmit, onCancel }: AddExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onSubmit({
      description,
      amount: parseFloat(amount),
      category_id: selectedCategory,
    });
  };

  return (
    <Card className="p-6 glass-card animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Novi trošak</h3>
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
          <Plus className="w-4 h-4 mr-2" />
          Dodaj trošak
        </Button>
      </form>
    </Card>
  );
}
