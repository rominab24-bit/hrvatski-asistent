import { useState } from 'react';
import { Category, getCategoryIcon } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface CategoryBreakdownProps {
  totals: Record<string, number>;
  categories: Category[];
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
}

export function CategoryBreakdown({ totals, categories, onCategoryClick }: CategoryBreakdownProps) {
  const [showAll, setShowAll] = useState(false);
  
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [_, value]) => sum + value, 0);
  
  // Categories with expenses
  const categoriesWithExpenses = entries.map(([categoryName]) => categoryName);
  
  // Categories without expenses
  const categoriesWithoutExpenses = categories.filter(
    c => !categoriesWithExpenses.includes(c.name)
  );

  if (entries.length === 0 && !showAll) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Nema podataka za prikaz</p>
        {categoriesWithoutExpenses.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="mt-2 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            Prikaži sve kategorije ({categories.length})
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      {categoriesWithoutExpenses.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground w-full justify-center"
        >
          {showAll ? (
            <>
              <EyeOff className="w-3 h-3 mr-1" />
              Sakrij prazne kategorije
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 mr-1" />
              Prikaži sve kategorije ({categories.length})
            </>
          )}
        </Button>
      )}

      {/* Categories with expenses */}
      {entries.map(([categoryName, amount], index) => {
        const category = categories.find(c => c.name === categoryName);
        const IconComponent = category ? getCategoryIcon(category.icon) : null;
        const percentage = total > 0 ? (amount / total) * 100 : 0;

        return (
          <div 
            key={categoryName}
            className={`animate-slide-up ${onCategoryClick ? 'cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => category && onCategoryClick?.(category.id, category.name)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {IconComponent && (
                  <IconComponent 
                    className="w-4 h-4" 
                    style={{ color: category?.color }} 
                  />
                )}
                <span className="text-sm font-medium">{categoryName}</span>
              </div>
              <span className="text-sm font-mono">{amount.toFixed(2)} €</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: category?.color || 'hsl(var(--muted-foreground))'
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Categories without expenses (when showAll is true) */}
      {showAll && categoriesWithoutExpenses.map((category, index) => {
        const IconComponent = getCategoryIcon(category.icon);

        return (
          <div 
            key={category.id}
            className={`animate-slide-up opacity-60 ${onCategoryClick ? 'cursor-pointer hover:bg-secondary/50 hover:opacity-100 -mx-2 px-2 py-1 rounded-lg transition-all' : ''}`}
            style={{ animationDelay: `${(entries.length + index) * 50}ms` }}
            onClick={() => onCategoryClick?.(category.id, category.name)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {IconComponent && (
                  <IconComponent 
                    className="w-4 h-4" 
                    style={{ color: category.color }} 
                  />
                )}
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">0.00 €</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
