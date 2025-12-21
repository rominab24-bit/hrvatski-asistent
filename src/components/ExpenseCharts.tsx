import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Expense } from '@/hooks/useExpenses';
import { Category } from '@/lib/categories';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths, startOfDay } from 'date-fns';
import { hr } from 'date-fns/locale';

interface ExpenseChartsProps {
  expenses: Expense[];
  categories: Category[];
}

export function ExpenseCharts({ expenses, categories }: ExpenseChartsProps) {
  // Daily expenses for last 7 days
  const dailyData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const total = expenses
        .filter(e => e.expense_date === dayStr)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: format(day, 'EEE', { locale: hr }),
        date: format(day, 'dd.MM.', { locale: hr }),
        iznos: total,
      };
    });
  }, [expenses]);

  // Monthly expenses for last 6 months
  const monthlyData = useMemo(() => {
    const today = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(today), 5),
      end: startOfMonth(today)
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const total = expenses
        .filter(e => {
          const date = new Date(e.expense_date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: format(month, 'MMM', { locale: hr }),
        mjesec: format(month, 'MMMM yyyy', { locale: hr }),
        iznos: total,
      };
    });
  }, [expenses]);

  // Category distribution
  const categoryData = useMemo(() => {
    const totals: Record<string, { name: string; value: number; color: string }> = {};

    expenses.forEach(expense => {
      const category = expense.category || { name: 'Ostalo', color: '#6B7280' };
      if (!totals[category.name]) {
        totals[category.name] = {
          name: category.name,
          value: 0,
          color: category.color,
        };
      }
      totals[category.name].value += Number(expense.amount);
    });

    return Object.values(totals).sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Weekly comparison
  const weeklyComparison = useMemo(() => {
    const today = startOfDay(new Date());
    const thisWeekStart = subDays(today, 6);
    const lastWeekStart = subDays(today, 13);
    const lastWeekEnd = subDays(today, 7);

    const thisWeek = expenses
      .filter(e => {
        const date = new Date(e.expense_date);
        return date >= thisWeekStart && date <= today;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const lastWeek = expenses
      .filter(e => {
        const date = new Date(e.expense_date);
        return date >= lastWeekStart && date <= lastWeekEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return { thisWeek, lastWeek, change };
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">
            {payload[0].value.toFixed(2)} €
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 glass-card">
          <p className="text-xs text-muted-foreground mb-1">Ovaj tjedan</p>
          <p className="text-xl font-bold">{weeklyComparison.thisWeek.toFixed(2)} €</p>
        </Card>
        <Card className="p-4 glass-card">
          <p className="text-xs text-muted-foreground mb-1">Prošli tjedan</p>
          <p className="text-xl font-bold">{weeklyComparison.lastWeek.toFixed(2)} €</p>
          {weeklyComparison.lastWeek > 0 && (
            <p className={`text-xs ${weeklyComparison.change > 0 ? 'text-destructive' : 'text-success'}`}>
              {weeklyComparison.change > 0 ? '+' : ''}{weeklyComparison.change.toFixed(1)}%
            </p>
          )}
        </Card>
      </div>

      {/* Daily Expenses Chart */}
      <Card className="p-4 glass-card">
        <h3 className="font-semibold mb-4">Zadnjih 7 dana</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="iznos" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly Trend Chart */}
      <Card className="p-4 glass-card">
        <h3 className="font-semibold mb-4">Mjesečni trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="iznos" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <Card className="p-4 glass-card">
          <h3 className="font-semibold mb-4">Raspodjela po kategorijama</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} €`, 'Iznos']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {categoryData.slice(0, 5).map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-muted-foreground">{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Categories List */}
      <Card className="p-4 glass-card">
        <h3 className="font-semibold mb-4">Top kategorije</h3>
        <div className="space-y-3">
          {categoryData.slice(0, 5).map((cat, i) => {
            const maxValue = categoryData[0]?.value || 1;
            const percentage = (cat.value / maxValue) * 100;
            
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat.name}</span>
                  <span className="font-mono">{cat.value.toFixed(2)} €</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
