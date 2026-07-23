import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const OWNER_EMAILS = ['rominab24@gmail.com'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Nedostaje autorizacija' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Neispravan token' }, 401);

    const email = userData.user.email?.toLowerCase().trim();
    if (!email || !OWNER_EMAILS.includes(email)) {
      return json({ error: 'Zabranjen pristup' }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const start30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const start7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ── Users ──
    const { data: usersList, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw uErr;
    const users = usersList.users;
    const totalUsers = users.length;
    const confirmedUsers = users.filter((u) => !!u.email_confirmed_at).length;
    const newUsers7d = users.filter((u) => u.created_at && u.created_at >= start7).length;
    const newUsers30d = users.filter((u) => u.created_at && u.created_at >= start30).length;
    const activeUsers30d = users.filter(
      (u) => u.last_sign_in_at && u.last_sign_in_at >= start30,
    ).length;

    // ── Scans ──
    const { data: scansAgg } = await admin
      .from('user_scan_usage')
      .select('user_id, count')
      .eq('month', monthStr);
    const scansThisMonth = (scansAgg ?? []).reduce(
      (s: number, r: { count: number }) => s + Number(r.count ?? 0),
      0,
    );
    const activeScannersThisMonth = (scansAgg ?? []).filter(
      (r: { count: number }) => Number(r.count ?? 0) > 0,
    ).length;

    // ── Categories ──
    const { count: totalCategories } = await admin
      .from('expense_categories')
      .select('id', { count: 'exact', head: true });
    const { count: totalFeedback } = await admin
      .from('category_feedback')
      .select('id', { count: 'exact', head: true });

    return json({
      generated_at: now.toISOString(),
      month: monthStr,
      users: {
        total: totalUsers,
        confirmed: confirmedUsers,
        new_last_7d: newUsers7d,
        new_last_30d: newUsers30d,
        active_last_30d: activeUsers30d,
      },
      scans: {
        this_month: scansThisMonth,
        active_users_this_month: activeScannersThisMonth,
      },
      categories: {
        total: totalCategories ?? 0,
        feedback_entries: totalFeedback ?? 0,
      },
    });
  } catch (e) {
    console.error('admin-stats error', e);
    return json({ error: (e as Error).message ?? 'Nepoznata greška' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
