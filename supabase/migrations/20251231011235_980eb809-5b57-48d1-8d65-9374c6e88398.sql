-- Create RPC function for system consumption counts (bypasses RLS for super admins)
CREATE OR REPLACE FUNCTION get_system_consumption_counts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  is_super_admin BOOLEAN;
BEGIN
  -- Verify super admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) INTO is_super_admin;
  
  IF NOT is_super_admin THEN
    RAISE EXCEPTION 'Access denied: super admin only';
  END IF;
  
  -- Perform counts without RLS evaluation per row
  SELECT json_build_object(
    'totalSites', (SELECT COUNT(*) FROM rank_rent_sites),
    'totalPages', (SELECT COUNT(*) FROM rank_rent_pages),
    'totalConversions', (SELECT COUNT(*) FROM rank_rent_conversions),
    'gscRequestsLast30Days', (SELECT COUNT(*) FROM gsc_url_indexing_requests WHERE created_at >= NOW() - INTERVAL '30 days'),
    'activeGscIntegrations', (SELECT COUNT(*) FROM google_search_console_integrations WHERE is_active = true),
    'geoRequestsLast30Days', (SELECT COUNT(*) FROM rank_rent_conversions WHERE city IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$;