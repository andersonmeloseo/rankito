-- Create RPC function to get database health metrics
CREATE OR REPLACE FUNCTION public.get_database_health_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_tables INTEGER;
  total_users INTEGER;
  total_sites INTEGER;
  total_conversions INTEGER;
  db_size TEXT;
BEGIN
  -- Count total tables in public schema
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  -- Count active users
  SELECT COUNT(*) INTO total_users
  FROM profiles WHERE is_active = true;
  
  -- Count total sites
  SELECT COUNT(*) INTO total_sites
  FROM rank_rent_sites;
  
  -- Count conversions in last 24 hours
  SELECT COUNT(*) INTO total_conversions
  FROM rank_rent_conversions
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- Get database size
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
  
  -- Return as JSON
  RETURN jsonb_build_object(
    'total_tables', total_tables,
    'total_active_users', total_users,
    'total_sites', total_sites,
    'conversions_last_24h', total_conversions,
    'database_size', db_size
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_database_health_metrics TO authenticated;