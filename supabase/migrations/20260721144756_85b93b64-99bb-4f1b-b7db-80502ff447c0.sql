
CREATE TABLE public.ai_scan_usage (
  month TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_scan_usage TO service_role;

ALTER TABLE public.ai_scan_usage ENABLE ROW LEVEL SECURITY;

-- No direct policies for anon/authenticated; access is via SECURITY DEFINER functions only.

CREATE OR REPLACE FUNCTION public.current_scan_month()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT to_char((now() AT TIME ZONE 'Europe/Zagreb')::date, 'YYYY-MM');
$$;

CREATE OR REPLACE FUNCTION public.increment_scan_usage(monthly_limit INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m TEXT := public.current_scan_month();
  new_count INTEGER;
  cur_count INTEGER;
BEGIN
  INSERT INTO public.ai_scan_usage(month, count)
  VALUES (m, 0)
  ON CONFLICT (month) DO NOTHING;

  SELECT count INTO cur_count FROM public.ai_scan_usage WHERE month = m FOR UPDATE;

  IF cur_count >= monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'count', cur_count, 'limit', monthly_limit, 'month', m);
  END IF;

  UPDATE public.ai_scan_usage
     SET count = count + 1, updated_at = now()
   WHERE month = m
  RETURNING count INTO new_count;

  RETURN jsonb_build_object('allowed', true, 'count', new_count, 'limit', monthly_limit, 'month', m);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_scan_usage(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_scan_usage(INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.get_scan_usage(monthly_limit INTEGER DEFAULT 250)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m TEXT := public.current_scan_month();
  c INTEGER;
BEGIN
  SELECT count INTO c FROM public.ai_scan_usage WHERE month = m;
  RETURN jsonb_build_object('count', COALESCE(c, 0), 'limit', monthly_limit, 'month', m);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_scan_usage(INTEGER) TO authenticated, service_role;
