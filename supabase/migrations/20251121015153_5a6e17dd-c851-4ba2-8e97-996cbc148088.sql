-- Create optimized RPC function for top projects performance
CREATE OR REPLACE FUNCTION get_top_projects_performance(
  user_id UUID,
  days_ago INTEGER DEFAULT 30,
  limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  site_id UUID,
  site_name TEXT,
  site_url TEXT,
  is_rented BOOLEAN,
  total_conversions BIGINT,
  page_views BIGINT,
  conversion_events BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as site_id,
    s.site_name,
    s.site_url,
    s.is_rented,
    COUNT(c.id)::BIGINT as total_conversions,
    COUNT(c.id) FILTER (WHERE c.event_type = 'page_view')::BIGINT as page_views,
    COUNT(c.id) FILTER (WHERE c.event_type != 'page_view')::BIGINT as conversion_events
  FROM rank_rent_sites s
  LEFT JOIN rank_rent_conversions c 
    ON c.site_id = s.id 
    AND c.created_at >= NOW() - (days_ago || ' days')::INTERVAL
  WHERE s.created_by_user_id = user_id 
    OR s.owner_user_id = user_id
  GROUP BY s.id, s.site_name, s.site_url, s.is_rented
  HAVING COUNT(c.id) > 0
  ORDER BY total_conversions DESC
  LIMIT limit_count;
END;
$$;