import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/hooks/useExpenses';
import { Category } from '@/lib/categories';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { History, Undo2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExpenseVersion {
  id: string;
  expense_id: string;
  description: string | null;
  amount: number | null;
  category_id: string | null;
  expense_date: string | null;
  change_type: string;
  created_at: string;
}

interface Props {
  expense: Expense | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRestore: (
    id: string,
    updates: { description?: string; amount?: number; category_id?: string | null; expense_date?: string }
  ) => Promise<unknown>;
}

export function ExpenseHistoryDialog({ expense, categories, open, onOpenChange, onRestore }: Props) {
  const [versions, setVersions] = useState<ExpenseVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !expense) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_versions')
        .select('*')
        .eq('expense_id', expense.id)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        if (error) {
          toast({ title: 'Greška', description: 'Nije moguće dohvatiti povijest', variant: 'destructive' });
        } else {
          setVersions((data as ExpenseVersion[]) || []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, expense, toast]);

  const catName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name || 'Nepoznata kategorija' : 'Bez kategorije';

  const handleRestore = async (v: ExpenseVersion) => {
    if (!expense) return;
    setRestoringId(v.id);
    await onRestore(expense.id, {
      description: v.description ?? undefined,
      amount: v.amount != null ? Number(v.amount) : undefined,
      category_id: v.category_id,
      expense_date: v.expense_date ?? undefined,
    });
    setRestoringId(null);
    // Refresh version list (a new snapshot of the current state was created by the trigger)
    const { data } = await supabase
      .from('expense_versions')
      .select('*')
      .eq('expense_id', expense.id)
      .order('created_at', { ascending: false });
    setVersions((data as ExpenseVersion[]) || []);
    toast({ title: 'Vraćeno', description: 'Prethodna verzija je vraćena' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Povijest izmjena
          </DialogTitle>
          <DialogDescription>
            Prethodne verzije troška. Kliknite "Vrati" da vratite stariji zapis.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nema prethodnih verzija — ovaj trošak još nije mijenjan.
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{v.description || '(bez opisa)'}</p>
                    <p className="text-xs text-muted-foreground">
                      {catName(v.category_id)}
                      {v.expense_date &&
                        ` • ${format(new Date(v.expense_date), 'd. MMM yyyy', { locale: hr })}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Snimljeno {format(new Date(v.created_at), 'd. MMM yyyy. HH:mm', { locale: hr })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold font-mono text-sm">
                      {v.amount != null ? `${formatCurrency(Number(v.amount))}` : '—'}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 px-2 text-xs"
                      disabled={restoringId === v.id}
                      onClick={() => handleRestore(v)}
                    >
                      {restoringId === v.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Undo2 className="w-3 h-3 mr-1" /> Vrati
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
