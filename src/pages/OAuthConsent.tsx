import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";

type AuthClient = { name?: string; client_name?: string; redirect_uri?: string };
type AuthDetails = {
  client?: AuthClient;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
  scopes?: string[];
};

// Local typed wrapper for beta supabase.auth.oauth namespace
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  };
}).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Nedostaje authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/?next=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user.email ?? null);
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Poslužitelj autorizacije nije vratio URL preusmjeravanja.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-md">
          <h1 className="font-display text-2xl mb-3">Zahtjev za autorizaciju nije uspio</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Učitavanje…</span>
        </div>
      </main>
    );
  }

  const clientName = details.client?.client_name ?? details.client?.name ?? "aplikacija";
  const scopes = details.scopes ?? (details.scope ? details.scope.split(/\s+/).filter(Boolean) : []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-secondary border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl leading-tight">Poveži {clientName}</h1>
            <p className="text-xs text-muted-foreground">s aplikacijom Kućni budžet</p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 mb-4">
          Ovo omogućuje <span className="font-semibold">{clientName}</span> da koristi alate ove aplikacije u vaše ime.
        </p>

        {email && (
          <p className="text-xs text-muted-foreground mb-4">
            Prijavljeni kao: <span className="text-foreground font-medium">{email}</span>
          </p>
        )}

        {details.client?.redirect_uri && (
          <p className="text-xs text-muted-foreground break-all mb-4">
            Preusmjeravanje: <span className="text-foreground/80">{details.client.redirect_uri}</span>
          </p>
        )}

        {scopes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Zatražene dozvole</p>
            <ul className="text-sm text-foreground/80 space-y-1">
              {scopes.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-6">
          Ovo ne zaobilazi dozvole i pravila ove aplikacije.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={() => decide(true)}
            disabled={busy}
            className="flex-1 bg-primary hover:bg-primary-glow text-primary-foreground rounded-2xl py-3"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Odobri"}
          </Button>
          <Button
            onClick={() => decide(false)}
            disabled={busy}
            variant="outline"
            className="flex-1 rounded-2xl py-3"
          >
            Odbij
          </Button>
        </div>
      </div>
    </main>
  );
}
