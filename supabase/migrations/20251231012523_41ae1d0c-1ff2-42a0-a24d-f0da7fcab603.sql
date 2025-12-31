-- Speed up date-filtered counts
CREATE INDEX IF NOT EXISTS idx_gsc_url_indexing_requests_created_at
ON public.gsc_url_indexing_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rank_rent_conversions_city_created_at
ON public.rank_rent_conversions (created_at DESC)
WHERE city IS NOT NULL;

-- Make system consumption counts fast enough for short statement timeouts
CREATE OR REPLACE FUNCTION public.get_system_consumption_counts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_sites BIGINT;
  total_pages BIGINT;
  total_conversions BIGINT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN json_build_object(
      'totalSites', 0,
      'totalPages', 0,
      'totalConversions', 0,
      'gscRequestsLast30Days', 0,
      'activeGscIntegrations', 0,
      'geoRequestsLast30Days', 0
    );
  END IF;

  -- Give this RPC enough time even if the API layer sets a low default
  PERFORM set_config('statement_timeout', '15s', true);
  PERFORM set_config('lock_timeout', '5s', true);

  -- Use planner stats for totals to avoid full table scans
  SELECT COALESCE(
    (SELECT n_live_tup::bigint FROM pg_stat_all_tables WHERE schemaname = 'public' AND relname = 'rank_rent_sites'),
    0
  ) INTO total_sites;

  SELECT COALESCE(
    (SELECT n_live_tup::bigint FROM pg_stat_all_tables WHERE schemaname = 'public' AND relname = 'rank_rent_pages'),
    0
  ) INTO total_pages;

  SELECT COALESCE(
    (SELECT n_live_tup::bigint FROM pg_stat_all_tables WHERE schemaname = 'public' AND relname = 'rank_rent_conversions'),
    0
  ) INTO total_conversions;

  SELECT json_build_object(
    'totalSites', total_sites,
    'totalPages', total_pages,
    'totalConversions', total_conversions,
    'gscRequestsLast30Days', (
      SELECT COUNT(*)
      FROM public.gsc_url_indexing_requests
      WHERE created_at >= NOW() - INTERVAL '30 days'
    ),
    'activeGscIntegrations', (
      SELECT COUNT(*)
      FROM public.google_search_console_integrations
      WHERE is_active = true
    ),
    'geoRequestsLast30Days', (
      SELECT COUNT(*)
      FROM public.rank_rent_conversions
      WHERE city IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_consumption_counts() TO authenticated;