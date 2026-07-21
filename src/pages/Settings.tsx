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
import { ArrowLeft, Trash2, Loader2, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

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

        <Card className="p-6 space-y-4 border-destructive/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-serif text-destructive">Opasna zona</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Trajno brisanje računa uklanja sve vaše troškove, skenirane račune, kategorije, verzije i povratne informacije. Ova radnja se ne može poništiti.
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
