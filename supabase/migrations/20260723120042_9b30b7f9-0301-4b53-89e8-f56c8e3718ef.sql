
CREATE TABLE IF NOT EXISTS public.user_scan_usage (
  user_id uuid NOT NULL,
  month text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month)
);

GRANT ALL ON public.user_scan_usage TO service_role;
ALTER TABLE public.user_scan_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to user_scan_usage"
  ON public.user_scan_usage FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "Deny authenticated access to user_scan_usage"
  ON public.user_scan_usage FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.get_user_scan_usage(_user_id uuid, monthly_limit integer DEFAULT 250)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m TEXT := public.current_scan_month();
  c INTEGER;
BEGIN
  SELECT count INTO c FROM public.user_scan_usage WHERE user_id = _user_id AND month = m;
  RETURN jsonb_build_object('count', COALESCE(c, 0), 'limit', monthly_limit, 'month', m);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_scan_usage(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_scan_usage(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_scan_usage(monthly_limit integer DEFAULT 250)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  m TEXT := public.current_scan_month();
  c INTEGER;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('count', 0, 'limit', monthly_limit, 'month', m);
  END IF;
  SELECT count INTO c FROM public.user_scan_usage WHERE user_id = uid AND month = m;
  RETURN jsonb_build_object('count', COALESCE(c, 0), 'limit', monthly_limit, 'month', m);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_scan_usage(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_scan_usage(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.increment_user_scan_usage(_user_id uuid, monthly_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m TEXT := public.current_scan_month();
  new_count INTEGER;
  cur_count INTEGER;
BEGIN
  INSERT INTO public.user_scan_usage(user_id, month, count)
  VALUES (_user_id, m, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT count INTO cur_count FROM public.user_scan_usage WHERE user_id = _user_id AND month = m FOR UPDATE;

  IF cur_count >= monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'count', cur_count, 'limit', monthly_limit, 'month', m);
  END IF;

  UPDATE public.user_scan_usage
     SET count = count + 1, updated_at = now()
   WHERE user_id = _user_id AND month = m
  RETURNING count INTO new_count;

  RETURN jsonb_build_object('allowed', true, 'count', new_count, 'limit', monthly_limit, 'month', m);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_user_scan_usage(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_scan_usage(uuid, integer) TO service_role;
