import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast({
        title: 'Greška',
        description: error.message,
        variant: 'destructive',
      });
    } else if (!isLogin) {
      toast({
        title: 'Uspjeh!',
        description: 'Račun je kreiran. Možete se prijaviti.',
      });
      setIsLogin(true);
    } else {
      // Successful sign-in: honor ?next= for OAuth consent flow
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next && next.startsWith('/')) {
        window.location.href = next;
        return;
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
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
            Pratite troškove pametno
          </p>
        </div>

        </div>

        {/* Login Form Container */}
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

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-xs font-semibold text-primary uppercase tracking-widest">
                  Lozinka
                </label>
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-auto bg-primary hover:bg-primary-glow text-primary-foreground font-bold py-4 rounded-2xl btn-glow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Prijavi se' : 'Registriraj se'}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Bottom Action */}
        <div className="mt-8 flex flex-col items-center">
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Nemate račun? ' : 'Već imate račun? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary hover:underline decoration-2 underline-offset-4"
            >
              {isLogin ? 'Registrirajte se' : 'Prijavite se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
