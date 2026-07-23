import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isOwner } from '@/lib/owner';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, RefreshCw, Users, Receipt, ScanLine, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  generated_at: string;
  month: string;
  users: { total: number; confirmed: number; new_last_7d: number; new_last_30d: number; active_last_30d: number };
  expenses: { total: number; this_month: number; total_amount_this_month: number };
  scans: { this_month: number; active_users_this_month: number };
  categories: { total: number; feedback_entries: number };
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owner = isOwner(user);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Niste prijavljeni');
      const { data, error } = await supabase.functions.invoke('admin-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setStats(data as Stats);
    } catch (e: any) {
      const msg = e.message ?? 'Greška pri dohvatu';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && owner) load();
  }, [authLoading, owner]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <SEO title="Administracija" description="Vlasnički panel" path="/admin" />
        <h1 className="text-2xl font-semibold">Zabranjen pristup</h1>
        <p className="text-muted-foreground">Ova stranica je vidljiva samo vlasniku aplikacije.</p>
        <Button onClick={() => navigate('/')}>Povratak</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      <SEO title="Administracija — Kućni Budžet" description="Vlasnički panel s korištenjem aplikacije" path="/admin" />
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" asChild aria-label="Natrag">
            <Link to="/settings"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-xl font-semibold flex-1">Administracija</h1>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Osvježi">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {error && (
          <Card className="p-4 border-destructive text-destructive text-sm">{error}</Card>
        )}

        {!stats && loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {stats && (
          <>
            <Section icon={<Users className="h-4 w-4" />} title="Korisnici">
              <Stat label="Ukupno registriranih" value={stats.users.total} />
              <Stat label="Potvrđeni e-mailom" value={stats.users.confirmed} />
              <Stat label="Aktivni (30 dana)" value={stats.users.active_last_30d} />
              <Stat label="Novi (7 dana)" value={stats.users.new_last_7d} />
              <Stat label="Novi (30 dana)" value={stats.users.new_last_30d} />
            </Section>

            <Section icon={<ScanLine className="h-4 w-4" />} title={`AI skeniranja (${stats.month})`}>
              <Stat label="Broj skeniranja" value={stats.scans.this_month} />
              <Stat label="Aktivni skeneri" value={stats.scans.active_users_this_month} />
            </Section>

            <Section icon={<Receipt className="h-4 w-4" />} title="Troškovi">
              <Stat label="Ukupno unosa" value={stats.expenses.total} />
              <Stat label="Unosi ovaj mjesec" value={stats.expenses.this_month} />
              <Stat
                label="Iznos ovaj mjesec"
                value={`${stats.expenses.total_amount_this_month.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} €`}
              />
            </Section>

            <Section icon={<Tag className="h-4 w-4" />} title="Kategorije">
              <Stat label="Ukupno kategorija" value={stats.categories.total} />
              <Stat label="Ispravci od korisnika" value={stats.categories.feedback_entries} />
            </Section>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Ažurirano {new Date(stats.generated_at).toLocaleString('hr-HR')}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
