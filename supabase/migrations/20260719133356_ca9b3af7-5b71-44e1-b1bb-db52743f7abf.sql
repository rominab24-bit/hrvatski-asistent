
CREATE TABLE public.mcp_tool_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mcp_tool_logs_user_created_idx ON public.mcp_tool_logs (user_id, created_at DESC);
CREATE INDEX mcp_tool_logs_tool_idx ON public.mcp_tool_logs (tool_name, created_at DESC);

GRANT SELECT, INSERT ON public.mcp_tool_logs TO authenticated;
GRANT ALL ON public.mcp_tool_logs TO service_role;

ALTER TABLE public.mcp_tool_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own mcp logs"
  ON public.mcp_tool_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own mcp logs"
  ON public.mcp_tool_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
