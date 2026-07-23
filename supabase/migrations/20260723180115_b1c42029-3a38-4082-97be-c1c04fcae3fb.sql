
CREATE OR REPLACE FUNCTION public.get_my_scan_usage(monthly_limit integer DEFAULT 250)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
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

-- Allow users to read only their own scan usage row so the invoker-scoped function works.
CREATE POLICY "Users can read own scan usage"
ON public.user_scan_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
