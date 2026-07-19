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
  name: "expense_summary",
  title: "Sažetak troškova",
  description:
    "Vraća ukupan iznos i razradu po kategorijama za zadani datumski raspon (default: tekući mjesec).",
  inputSchema: {
    from: z.string().optional().describe("Početni datum (YYYY-MM-DD)."),
    to: z.string().optional().describe("Krajnji datum (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: withLogging("expense_summary", async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text" as const, text: "Niste prijavljeni." }], isError: true };
    }
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const rangeFrom = from ?? defaultFrom;
    const rangeTo = to ?? defaultTo;

    const { data, error } = await supabaseForUser(ctx)
      .from("expenses")
      .select("amount, expense_categories(name)")
      .gte("expense_date", rangeFrom)
      .lte("expense_date", rangeTo);
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const row of (data ?? []) as any[]) {
      const name = row.expense_categories?.name ?? "Ostalo";
      const amt = Number(row.amount) || 0;
      byCategory[name] = (byCategory[name] ?? 0) + amt;
      total += amt;
    }
    const summary = {
      from: rangeFrom,
      to: rangeTo,
      total: Math.round(total * 100) / 100,
      by_category: Object.entries(byCategory)
        .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
        .sort((a, b) => b.amount - a.amount),
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  }),
});
