import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Receipt, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        const status = (error as { status?: number }).status;
        const code = (error as { code?: string }).code;
        let title = 'Slanje poveznice nije uspjelo';
        let description = error.message;

        if (status === 429 || code === 'over_email_send_rate_limit') {
          title = 'Previše pokušaja';
          description =
            'Poslali ste previše zahtjeva za resetiranje lozinke u kratkom vremenu. Pričekajte nekoliko minuta pa pokušajte ponovno.';
        } else if (code === 'validation_failed' || status === 400) {
          title = 'Neispravna e-mail adresa';
          description = 'Provjerite jeste li ispravno unijeli svoju e-mail adresu i pokušajte ponovno.';
        } else if (!navigator.onLine) {
          title = 'Nema internetske veze';
          description = 'Provjerite internetsku vezu i pokušajte ponovno za nekoliko trenutaka.';
        } else if (status && status >= 500) {
          title = 'Poslužitelj trenutno nije dostupan';
          description = 'Došlo je do privremene greške na poslužitelju. Pokušajte ponovno za nekoliko minuta.';
        } else {
          description = `${error.message}. Pokušajte ponovno za nekoliko minuta ili nas kontaktirajte ako se problem nastavi.`;
        }

        toast({ title, description, variant: 'destructive' });
      } else {
        toast({
          title: 'Provjerite e-mail',
          description:
            'Poslali smo vam poveznicu za resetiranje lozinke. Ako je ne vidite u sandučiću, provjerite mapu neželjene pošte (spam).',
        });
        setMode('login');
      }
      setIsLoading(false);
      return;
    }

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast({ title: 'Greška', description: error.message, variant: 'destructive' });
    } else if (mode === 'signup') {
      toast({ title: 'Uspjeh!', description: 'Račun je kreiran. Možete se prijaviti.' });
      setMode('login');
    } else {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next && next.startsWith('/')) {
        window.location.href = next;
        return;
      }
    }

    setIsLoading(false);
  };

  const submitLabel =
    mode === 'login' ? 'Prijavi se' : mode === 'signup' ? 'Registriraj se' : 'Pošalji poveznicu';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col items-center animate-fade-in">
        {/* Brand Identity */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary blur-3xl opacity-20 scale-150" />
          <div className="relative flex items-center justify-center w-20 h-20 bg-secondary rounded-3xl border border-primary/20 shadow-glow">
            <Receipt className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-foreground mb-2 tracking-tight">
            Kućni budžet
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'forgot' ? 'Resetirajte svoju lozinku' : 'Pratite troškove pametno'}
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full bg-card border border-border rounded-[2rem] p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary uppercase tracking-widest ml-1">
                Email adresa
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <Input
                  type="email"
                  placeholder="vas@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-auto w-full bg-input border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex justify-between items-end ml-1">
                  <label className="text-xs font-semibold text-primary uppercase tracking-widest">
                    Lozinka
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-primary hover:underline decoration-2 underline-offset-4"
                    >
                      Zaboravili ste lozinku?
                    </button>
                  )}
                </div>
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
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-auto bg-primary hover:bg-primary-glow text-primary-foreground font-bold py-4 rounded-2xl btn-glow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{submitLabel}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            {mode === 'signup' && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                Registrirajući se prihvaćate{' '}
                <Link to="/terms" className="text-primary hover:underline underline-offset-2">
                  Uvjete korištenja
                </Link>{' '}
                i{' '}
                <Link to="/privacy" className="text-primary hover:underline underline-offset-2">
                  Pravila privatnosti
                </Link>
                .
              </p>
            )}
          </form>
        </div>

        {/* Bottom Action */}
        <div className="mt-8 flex flex-col items-center">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline decoration-2 underline-offset-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Natrag na prijavu
            </button>
          ) : (
            <p className="text-muted-foreground text-sm">
              {mode === 'login' ? 'Nemate račun? ' : 'Već imate račun? '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="font-semibold text-primary hover:underline decoration-2 underline-offset-4"
              >
                {mode === 'login' ? 'Registrirajte se' : 'Prijavite se'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
