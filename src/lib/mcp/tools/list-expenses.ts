import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { withLogging } from "../with-logging";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_expenses",
  title: "Popis troškova",
  description:
    "Vraća troškove prijavljenog korisnika. Podržava filtriranje po datumskom rasponu (from/to, ISO datum YYYY-MM-DD) i ograničenje broja rezultata.",
  inputSchema: {
    from: z.string().optional().describe("Početni datum (YYYY-MM-DD), uključivo."),
    to: z.string().optional().describe("Krajnji datum (YYYY-MM-DD), uključivo."),
    limit: z.number().int().positive().max(500).optional().describe("Maksimalan broj troškova (default 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: withLogging("list_expenses", async ({ from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niste prijavljeni." }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let query = sb
      .from("expenses")
      .select("id, amount, description, expense_date, category_id, expense_categories(name)")
      .order("expense_date", { ascending: false })
      .limit(limit ?? 100);
    if (from) query = query.gte("expense_date", from);
    if (to) query = query.lte("expense_date", to);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      description: r.description,
      expense_date: r.expense_date,
      category: r.expense_categories?.name ?? null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { expenses: rows, count: rows.length },
    };
  }),
});
