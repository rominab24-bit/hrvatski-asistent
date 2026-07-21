import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Loader2, AlertTriangle, Download, FileText, FileSpreadsheet, Calculator } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/exportData';
import SubscriptionWizard from '@/components/SubscriptionWizard';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const fetchAllData = async () => {
    const { data: expenses, error: e1 } = await supabase
      .from('expenses')
      .select('id, description, amount, expense_date, category:expense_categories(name, icon)')
      .order('expense_date', { ascending: false });
    if (e1) throw e1;
    const { data: categories, error: e2 } = await supabase
      .from('expense_categories')
      .select('id, name, icon, color');
    if (e2) throw e2;
    return { expenses: (expenses ?? []) as any[], categories: (categories ?? []) as any[] };
  };

  const handleExport = async (kind: 'csv' | 'pdf') => {
    setExporting(kind);
    try {
      const { expenses, categories } = await fetchAllData();
      if (!expenses.length) {
        toast.info('Nemate spremljenih troškova za izvoz');
        return;
      }
      const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
      if (kind === 'csv') {
        exportToCSV(expenses, 'moji-podaci');
        toast.success(`Izvezeno ${expenses.length} troškova u CSV`);
      } else {
        exportToPDF(expenses, categories, total, 'moji-podaci');
        toast.success(`Izvezeno ${expenses.length} troškova u PDF`);
      }
    } catch (e: any) {
      toast.error(`Greška pri izvozu: ${e.message ?? 'Nepoznata greška'}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'OBRIŠI') {
      toast.error('Molimo upišite OBRIŠI za potvrdu');
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Niste prijavljeni');

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      // Clear local data
      try { localStorage.clear(); } catch {}
      await supabase.auth.signOut();
      toast.success('Vaš račun i podaci su trajno obrisani');
      navigate('/');
    } catch (e: any) {
      toast.error(`Greška: ${e.message ?? 'Neuspješno brisanje'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-serif">Postavke</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-2">
          <h2 className="text-lg font-serif">Vaš račun</h2>
          <p className="text-sm text-muted-foreground">Prijavljeni ste kao <span className="font-medium text-foreground">{user?.email}</span></p>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-serif">Izvoz mojih podataka</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Preuzmite kopiju svih svojih troškova prije brisanja računa. Preporučujemo izvoz prije trajnog uklanjanja podataka.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="flex-1"
            >
              {exporting === 'csv'
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Priprema...</>
                : <><FileSpreadsheet className="w-4 h-4 mr-2" />Preuzmi CSV</>}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="flex-1"
            >
              {exporting === 'pdf'
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Priprema...</>
                : <><FileText className="w-4 h-4 mr-2" />Preuzmi PDF</>}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Calculator className="w-5 h-5 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-serif">Kalkulator pretplate</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Procijenite mjesečni trošak Lovable kredita prema broju korisnika i očekivanom broju AI skeniranja te dobijte preporuku plana.
              </p>
            </div>
          </div>
          <SubscriptionWizard />
        </Card>

        <Card className="p-6 space-y-4 border-destructive/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-serif text-destructive">Opasna zona</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Trajno brisanje računa uklanja sve vaše troškove, skenirane račune, kategorije, verzije i povratne informacije. Ova radnja se ne može poništiti.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Savjet: prvo preuzmite CSV ili PDF izvoz iznad — nakon brisanja podaci se ne mogu vratiti.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Obriši račun i sve podatke
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Jeste li potpuno sigurni?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ovo će trajno obrisati vaš račun, sve troškove, slike računa, kategorije i povijest. Ova radnja se <strong>ne može poništiti</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm">Za potvrdu upišite <span className="font-mono font-semibold">OBRIŠI</span></Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="OBRIŠI"
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading} onClick={() => setConfirmText('')}>Odustani</AlertDialogCancel>
                <AlertDialogAction
                  disabled={loading || confirmText !== 'OBRIŠI'}
                  onClick={(e) => { e.preventDefault(); handleDelete(); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Brisanje...</> : 'Trajno obriši'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </main>
    </div>
  );
}
