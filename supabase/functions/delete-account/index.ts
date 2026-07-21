import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nedostaje autorizacija' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller with anon client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Neispravan token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    // Delete receipt files from storage
    try {
      const { data: files } = await admin.storage.from('receipts').list(userId, { limit: 1000 });
      if (files && files.length) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await admin.storage.from('receipts').remove(paths);
      }
    } catch (e) {
      console.error('storage cleanup failed', e);
    }

    // Delete rows in user tables
    const tables = ['category_feedback', 'expense_versions', 'expenses', 'expense_categories', 'mcp_tool_logs'];
    for (const t of tables) {
      const { error } = await admin.from(t).delete().eq('user_id', userId);
      if (error) console.error(`delete ${t}`, error);
    }

    // Delete auth user
    const { error: delError } = await admin.auth.admin.deleteUser(userId);
    if (delError) {
      return new Response(JSON.stringify({ error: delError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
