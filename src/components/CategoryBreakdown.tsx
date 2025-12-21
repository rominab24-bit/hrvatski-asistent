import { Category, getCategoryIcon } from '@/lib/categories';

interface CategoryBreakdownProps {
  totals: Record<string, number>;
  categories: Category[];
}

export function CategoryBreakdown({ totals, categories }: CategoryBreakdownProps) {
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [_, value]) => sum + value, 0);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Nema podataka za prikaz</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([categoryName, amount], index) => {
        const category = categories.find(c => c.name === categoryName);
        const IconComponent = category ? getCategoryIcon(category.icon) : null;
        const percentage = total > 0 ? (amount / total) * 100 : 0;

        return (
          <div 
            key={categoryName}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
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
    </div>
  );
}
