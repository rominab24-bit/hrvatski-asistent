import { SEO } from '@/components/SEO';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import { AuthForm } from '@/components/AuthForm';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Home, Loader2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval,
} from 'date-fns';
import { hr } from 'date-fns/locale';
import { getCategoryIcon } from '@/lib/categories';
import { exportUtilitiesCSV, exportUtilitiesXLSX } from '@/lib/exportUtilities';
import { toast } from 'sonner';

const UTILITY_NAMES = [
  'Voda',
  'Struja',
  'Grijanje',
  'Stambena pričuva',
  'TV',
  'Smeće',
  'Komunalna naknada',
  'Kućni internet',
];

export default function UtilitiesReport() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const {
    expenses, categories, isLoading, isSyncing, getPendingCount,
  } = useExpenses();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const utilityCategoryIds = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => {
      if (UTILITY_NAMES.some(n => n.toLowerCase() === c.name.toLowerCase())) {
        set.add(c.id);
      }
    });
    return set;
  }, [categories]);

  const utilityExpenses = useMemo(
    () => expenses.filter(e => e.category_id && utilityCategoryIds.has(e.category_id)),
    [expenses, utilityCategoryIds]
  );

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthExpenses = useMemo(
    () => utilityExpenses.filter(e => {
      const d = new Date(e.expense_date);
      return d >= monthStart && d <= monthEnd;
    }),
    [utilityExpenses, monthStart, monthEnd]
  );

  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Breakdown per utility category for selected month
  const perCategory = useMemo(() => {
    return categories
      .filter(c => utilityCategoryIds.has(c.id))
      .map(c => {
        const items = monthExpenses.filter(e => e.category_id === c.id);
        const total = items.reduce((s, e) => s + Number(e.amount), 0);
        return { id: c.id, name: c.name, icon: c.icon, color: c.color, total, count: items.length };
      })
      .sort((a, b) => b.total - a.total);
  }, [categories, utilityCategoryIds, monthExpenses]);

  // Monthly trend – last 6 months of utilities
  const trendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(startOfMonth(new Date()), 5),
      end: startOfMonth(new Date()),
    });
    return months.map(m => {
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const total = utilityExpenses
        .filter(e => {
          const d = new Date(e.expense_date);
          return d >= ms && d <= me;
        })
        .reduce((s, e) => s + Number(e.amount), 0);
      return {
        name: format(m, 'MMM', { locale: hr }),
        iznos: Number(total.toFixed(2)),
      };
    });
  }, [utilityExpenses]);

  const chartData = perCategory
    .filter(c => c.total > 0)
    .map(c => ({ name: c.name, iznos: Number(c.total.toFixed(2)) }));

  const prevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const nextMonth = () => {
    const next = subMonths(selectedMonth, -1);
    if (next <= new Date()) setSelectedMonth(next);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <AuthForm />;

  return (
    <>
      <SEO title="Kućne režije — Kućni Budžet" description="Mjesečni pregled režijskih troškova (voda, struja, grijanje, internet) s grafovima i izvozom u Excel." path="/utilities" />
      <OfflineIndicator pendingCount={getPendingCount()} isSyncing={isSyncing} />
      <div className="min-h-screen bg-background pb-8">
        <header className="p-4 flex items-center gap-3 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">Kućne režije</h1>
              <p className="text-xs text-muted-foreground truncate">Izvještaj troškova režija</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Izvezi izvještaj"
                disabled={monthExpenses.length === 0}
              >
                <Download className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  try {
                    exportUtilitiesCSV(monthExpenses, perCategory, monthTotal, selectedMonth);
                    toast.success('CSV izvještaj izvezen');
                  } catch {
                    toast.error('Greška pri izvozu CSV-a');
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                Izvezi CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  try {
                    exportUtilitiesXLSX(monthExpenses, perCategory, monthTotal, selectedMonth);
                    toast.success('Excel izvještaj izvezen');
                  } catch {
                    toast.error('Greška pri izvozu Excel datoteke');
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                Izvezi Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="p-4 space-y-4">
          {/* Month selector */}
          <Card className="p-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Odabrani mjesec</p>
              <p className="font-semibold capitalize">
                {format(selectedMonth, 'LLLL yyyy.', { locale: hr })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              disabled={format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Card>

          {/* Totals */}
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Ukupno za režije</p>
            <p className="text-3xl font-bold text-primary mt-1">{monthTotal.toFixed(2)} €</p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthExpenses.length} račun(a) u ovom mjesecu
            </p>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : utilityCategoryIds.size === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Nema definiranih kategorija za režije.</p>
            </Card>
          ) : (
            <>
              {/* Per category list */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Po kategorijama</h2>
                {perCategory.length === 0 || monthTotal === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nema troškova režija u ovom mjesecu.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {perCategory.map(c => {
                      const Icon = getCategoryIcon(c.icon);
                      const pct = monthTotal > 0 ? (c.total / monthTotal) * 100 : 0;
                      return (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${c.color}20`, color: c.color }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-sm truncate">{c.name}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                ({c.count})
                              </span>
                            </div>
                            <span className="text-sm font-semibold shrink-0">
                              {c.total.toFixed(2)} €
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: c.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Bar chart per category */}
              {chartData.length > 0 && (
                <Card className="p-4">
                  <h2 className="font-semibold mb-3">Usporedba režija</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                        <Bar dataKey="iznos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Trend last 6 months */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Trend zadnjih 6 mjeseci</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(2)} €`} />
                      <Line type="monotone" dataKey="iznos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* List of bills */}
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Računi u mjesecu</h2>
                {monthExpenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nema računa za režije.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {monthExpenses
                      .slice()
                      .sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1))
                      .map(e => {
                        const cat = categories.find(c => c.id === e.category_id);
                        const Icon = cat ? getCategoryIcon(cat.icon) : Zap;
                        return (
                          <div
                            key={e.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: cat ? `${cat.color}20` : undefined,
                                  color: cat?.color,
                                }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{e.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {cat?.name} · {format(new Date(e.expense_date), 'dd.MM.yyyy.')}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold shrink-0">
                              {Number(e.amount).toFixed(2)} €
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </>
  );
}
