import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_expense",
  title: "Dodaj trošak",
  description:
    "Dodaje novi trošak za prijaljenog korisnika. Kategorija se pronalazi po imenu (ako je navedena).",
  inputSchema: {
    amount: z.number().positive().describe("Iznos troška u eurima."),
    description: z.string().min(1).describe("Kratak opis troška."),
    expense_date: z.string().optional().describe("Datum troška (YYYY-MM-DD). Default: danas."),
    category: z.string().optional().describe("Naziv kategorije (npr. 'Hrana'). Opcionalno."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ amount, description, expense_date, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Niste prijavljeni." }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let categoryId: string | null = null;
    if (category) {
      const { data: cats } = await sb
        .from("expense_categories")
        .select("id, name")
        .ilike("name", category)
        .limit(1);
      categoryId = cats?.[0]?.id ?? null;
    }
    const { data, error } = await sb
      .from("expenses")
      .insert({
        user_id: ctx.getUserId(),
        amount,
        description,
        expense_date: expense_date ?? new Date().toISOString().slice(0, 10),
        category_id: categoryId,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Trošak spremljen: ${data.description} (${data.amount} €).` }],
      structuredContent: { expense: data },
    };
  },
});
