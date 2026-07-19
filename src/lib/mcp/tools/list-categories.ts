import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { withLogging } from "../with-logging";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_categories",
  title: "Popis kategorija",
  description: "Vraća sve kategorije troškova dostupne prijavljenom korisniku (zadane i vlastite).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: withLogging("list_categories", async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text" as const, text: "Niste prijavljeni." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("expense_categories")
      .select("id, name, icon, color")
      .order("name");
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      structuredContent: { categories: data ?? [] },
    };
  },
});
