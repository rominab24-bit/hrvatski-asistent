import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const OWNER_EMAILS = ['rominab24@gmail.com'];
// "Trajno" ukidanje pristupa — Supabase koristi banned_until (do 100 godina).
const FOREVER_BAN = '876000h';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Nedostaje autorizacija' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Neispravan token' }, 401);

    const callerEmail = userData.user.email?.toLowerCase().trim();
    if (!callerEmail || !OWNER_EMAILS.includes(callerEmail)) {
      return json({ error: 'Zabranjen pristup' }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    if (req.method === 'GET') {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: usersList, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (uErr) throw uErr;

      const ids = usersList.users.map((u) => u.id);

      const [{ data: scans }, { data: exp }] = await Promise.all([
        admin.from('user_scan_usage').select('user_id, count').eq('month', monthStr).in('user_id', ids),
        admin.from('expenses').select('user_id').in('user_id', ids),
      ]);

      const scanMap = new Map<string, number>();
      (scans ?? []).forEach((r: any) => scanMap.set(r.user_id, Number(r.count ?? 0)));
      const expMap = new Map<string, number>();
      (exp ?? []).forEach((r: any) => expMap.set(r.user_id, (expMap.get(r.user_id) ?? 0) + 1));

      const users = usersList.users
        .map((u) => {
          const bannedUntil = (u as any).banned_until as string | null | undefined;
          const isBanned = !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
          return {
            id: u.id,
            email: u.email ?? '',
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
            email_confirmed_at: u.email_confirmed_at ?? null,
            banned_until: bannedUntil ?? null,
            is_banned: isBanned,
            is_owner: OWNER_EMAILS.includes((u.email ?? '').toLowerCase().trim()),
            scans_this_month: scanMap.get(u.id) ?? 0,
            expenses_total: expMap.get(u.id) ?? 0,
          };
        })
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      return json({ users, month: monthStr });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { action, user_id } = body as { action?: string; user_id?: string };
      if (!action || !user_id) return json({ error: 'Nedostaju parametri' }, 400);

      // Sigurnosna zaštita: ne dopusti akcije nad vlasničkim računom.
      const { data: targetRes } = await admin.auth.admin.getUserById(user_id);
      const targetEmail = targetRes?.user?.email?.toLowerCase().trim();
      if (targetEmail && OWNER_EMAILS.includes(targetEmail)) {
        return json({ error: 'Ne možete mijenjati vlasnički račun' }, 403);
      }

      if (action === 'ban') {
        const { error } = await admin.auth.admin.updateUserById(user_id, {
          ban_duration: FOREVER_BAN,
        } as any);
        if (error) throw error;
        return json({ ok: true });
      }
      if (action === 'unban') {
        const { error } = await admin.auth.admin.updateUserById(user_id, {
          ban_duration: 'none',
        } as any);
        if (error) throw error;
        return json({ ok: true });
      }
      if (action === 'delete') {
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return json({ ok: true });
      }
      return json({ error: 'Nepoznata akcija' }, 400);
    }

    return json({ error: 'Metoda nije dopuštena' }, 405);
  } catch (e) {
    console.error('admin-users error', e);
    return json({ error: (e as Error).message ?? 'Nepoznata greška' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
