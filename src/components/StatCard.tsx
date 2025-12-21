import { Category, getCategoryIcon } from '@/lib/categories';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  category?: Category;
}

export function StatCard({ title, value, subtitle, icon, category }: StatCardProps) {
  const IconComponent = category ? getCategoryIcon(category.icon) : null;
  
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1 font-mono">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-secondary">
            {icon}
          </div>
        )}
        {category && IconComponent && (
          <div 
            className="p-2 rounded-lg" 
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent className="w-5 h-5" style={{ color: category.color }} />
          </div>
        )}
      </div>
    </div>
  );
}
