import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

// Fire-and-forget log write. Never throw from here; logging must never
// break the tool call itself.
export async function logMcpCall(
  ctx: ToolContext,
  toolName: string,
  status: "success" | "error",
  errorMessage: string | null,
  durationMs: number,
) {
  try {
    if (!ctx.isAuthenticated()) return;
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    await sb.from("mcp_tool_logs").insert({
      user_id: ctx.getUserId(),
      tool_name: toolName,
      status,
      error_message: errorMessage,
      duration_ms: durationMs,
    });
  } catch {
    // swallow
  }
}

export function withLogging<I, R>(
  toolName: string,
  handler: (input: I, ctx: ToolContext) => Promise<R> | R,
): (input: I, ctx: ToolContext) => Promise<R> {
  return async (input: I, ctx: ToolContext) => {
    const start = Date.now();
    try {
      const result = await handler(input, ctx);
      const isError = !!(result && (result as any).isError);
      const errMsg = isError
        ? ((result as any)?.content?.[0]?.text ?? "unknown error")
        : null;
      await logMcpCall(
        ctx,
        toolName,
        isError ? "error" : "success",
        errMsg,
        Date.now() - start,
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logMcpCall(ctx, toolName, "error", msg, Date.now() - start);
      throw err;
    }
  };
}

