import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, Loader2, Receipt } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and creates a session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'Greška', description: 'Lozinke se ne podudaraju.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Greška', description: 'Lozinka mora imati najmanje 6 znakova.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Greška', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uspjeh!', description: 'Lozinka je uspješno promijenjena.' });
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <SEO title="Postavi novu lozinku — Kućni Budžet" description="Postavite novu lozinku za pristup aplikaciji Kućni Budžet." path="/reset-password" />
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col items-center animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary blur-3xl opacity-20 scale-150" />
          <div className="relative flex items-center justify-center w-20 h-20 bg-secondary rounded-3xl border border-primary/20 shadow-glow">
            <Receipt className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-foreground mb-2 tracking-tight">Nova lozinka</h1>
          <p className="text-muted-foreground text-sm">Postavite novu lozinku za svoj račun</p>
        </div>

        <div className="w-full bg-card border border-border rounded-[2rem] p-8 shadow-md">
          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-center">
                Provjeravamo vašu poveznicu za resetiranje. Ako se ništa ne dogodi, otvorite poveznicu iz e-maila ponovno.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-primary uppercase tracking-widest ml-1">
                  Nova lozinka
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-auto w-full bg-input border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-primary uppercase tracking-widest ml-1">
                  Potvrdite lozinku
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="h-auto w-full bg-input border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-auto bg-primary hover:bg-primary-glow text-primary-foreground font-bold py-4 rounded-2xl btn-glow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Spremi novu lozinku</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
