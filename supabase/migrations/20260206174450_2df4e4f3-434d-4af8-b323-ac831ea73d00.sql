-- Criar RPC otimizada v2 com CTE único (sem COUNT DISTINCT)
CREATE OR REPLACE FUNCTION public.get_session_analytics_v2(
  p_site_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  WITH session_data AS (
    SELECT 
      entry_page_url,
      exit_page_url,
      pages_visited,
      total_duration_seconds
    FROM rank_rent_sessions
    WHERE site_id = p_site_id
      AND entry_time >= p_start_date
      AND entry_time <= p_end_date
  ),
  metrics AS (
    SELECT 
      COUNT(*)::bigint as total_sessions,
      COUNT(*) FILTER (WHERE pages_visited = 1)::bigint as bounce_count,
      COALESCE(AVG(total_duration_seconds), 0) as avg_duration,
      COALESCE(AVG(pages_visited), 0) as avg_pages
    FROM session_data
  )
  SELECT json_build_object(
    'metrics', (
      SELECT json_build_object(
        'totalSessions', m.total_sessions,
        'uniqueVisitors', m.total_sessions,
        'newVisitors', m.total_sessions,
        'returningVisitors', 0,
        'avgDuration', ROUND(m.avg_duration),
        'avgPagesPerSession', ROUND(m.avg_pages::numeric, 2),
        'engagementRate', CASE WHEN m.total_sessions > 0 
          THEN ROUND(((m.total_sessions - m.bounce_count)::numeric / m.total_sessions) * 100, 1) 
          ELSE 0 END,
        'bounceRate', CASE WHEN m.total_sessions > 0 
          THEN ROUND((m.bounce_count::numeric / m.total_sessions) * 100, 2) 
          ELSE 0 END
      ) FROM metrics m
    ),
    'topEntryPages', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT entry_page_url as page_url, COUNT(*)::bigint as entries, 0::bigint as exits
        FROM session_data
        GROUP BY entry_page_url
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::json),
    'topExitPages', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT exit_page_url as page_url, COUNT(*)::bigint as exits, 0::bigint as entries
        FROM session_data
        WHERE exit_page_url IS NOT NULL
        GROUP BY exit_page_url
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;