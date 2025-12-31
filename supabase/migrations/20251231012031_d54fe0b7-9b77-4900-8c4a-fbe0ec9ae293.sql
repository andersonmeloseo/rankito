CREATE OR REPLACE FUNCTION get_system_consumption_counts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Usar funcao has_role que ja funciona no sistema
  IF NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    -- Retornar JSON vazio em vez de exception para nao quebrar frontend
    RETURN json_build_object(
      'totalSites', 0,
      'totalPages', 0,
      'totalConversions', 0,
      'gscRequestsLast30Days', 0,
      'activeGscIntegrations', 0,
      'geoRequestsLast30Days', 0
    );
  END IF;
  
  -- Perform counts without RLS
  SELECT json_build_object(
    'totalSites', (SELECT COUNT(*) FROM rank_rent_sites),
    'totalPages', (SELECT COUNT(*) FROM rank_rent_pages),
    'totalConversions', (SELECT COUNT(*) FROM rank_rent_conversions),
    'gscRequestsLast30Days', (SELECT COUNT(*) FROM gsc_url_indexing_requests 
                               WHERE created_at >= NOW() - INTERVAL '30 days'),
    'activeGscIntegrations', (SELECT COUNT(*) FROM google_search_console_integrations 
                               WHERE is_active = true),
    'geoRequestsLast30Days', (SELECT COUNT(*) FROM rank_rent_conversions 
                               WHERE city IS NOT NULL 
                               AND created_at >= NOW() - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$;