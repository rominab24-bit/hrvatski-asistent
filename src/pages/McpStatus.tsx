import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Activity, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';

type LogRow = {
  id: string;
  tool_name: string;
  status: 'success' | 'error';
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
};

export default function McpStatus() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('mcp_tool_logs')
      .select('id, tool_name, status, error_message, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs((data ?? []) as LogRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === 'success').length;
    const errors = total - success;
    const rate = total ? Math.round((success / total) * 100) : 0;
    const avg = total
      ? Math.round(
          logs.reduce((s, l) => s + (l.duration_ms ?? 0), 0) / total,
        )
      : 0;
    const byTool: Record<string, { s: number; e: number }> = {};
    for (const l of logs) {
      byTool[l.tool_name] ??= { s: 0, e: 0 };
      if (l.status === 'success') byTool[l.tool_name].s++;
      else byTool[l.tool_name].e++;
    }
    return { total, success, errors, rate, avg, byTool };
  }, [logs]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="p-4 flex items-center gap-3 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif">MCP Status</h1>
          <p className="text-xs text-muted-foreground">Praćenje poziva agent alata</p>
        </div>
        <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Uspješnost</div>
            <div className="text-2xl font-semibold">{stats.rate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.success} uspjeh · {stats.errors} greška
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Prosj. trajanje</div>
            <div className="text-2xl font-semibold">{stats.avg} ms</div>
            <div className="text-xs text-muted-foreground mt-1">Ukupno {stats.total} poziva</div>
          </Card>
        </div>

        {Object.keys(stats.byTool).length > 0 && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Po alatu
            </div>
            <div className="space-y-2">
              {Object.entries(stats.byTool).map(([tool, v]) => (
                <div key={tool} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{tool}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {v.s}
                    </Badge>
                    {v.e > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> {v.e}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div>
          <div className="text-sm font-medium mb-2">Nedavni pozivi</div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nema zabilježenih poziva. Pozovi MCP alat iz spojenog klijenta.
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <Card key={l.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {l.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="font-mono text-sm truncate">{l.tool_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {l.duration_ms ?? '–'} ms
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: hr })}
                    </span>
                  </div>
                  {l.error_message && (
                    <div className="text-xs text-destructive mt-2 break-words">
                      {l.error_message}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
