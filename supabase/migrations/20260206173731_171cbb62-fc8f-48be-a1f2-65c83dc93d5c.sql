-- Índices compostos para otimizar filtros site_id + data
CREATE INDEX IF NOT EXISTS idx_visits_site_created ON rank_rent_page_visits (site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_site_entry ON rank_rent_sessions (site_id, entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_site_created ON rank_rent_conversions (site_id, created_at DESC);

-- RPC otimizada para analytics de sessão (versão simplificada)
CREATE OR REPLACE FUNCTION get_session_analytics(
  p_site_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  v_session_count BIGINT;
  v_bounce_count BIGINT;
  v_unique_visitors BIGINT;
  v_avg_duration NUMERIC;
  v_avg_pages NUMERIC;
BEGIN
  -- Calcular métricas básicas em uma única query
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE pages_visited = 1),
    COUNT(DISTINCT session_id),
    COALESCE(AVG(total_duration_seconds), 0),
    COALESCE(AVG(pages_visited), 0)
  INTO v_session_count, v_bounce_count, v_unique_visitors, v_avg_duration, v_avg_pages
  FROM rank_rent_sessions
  WHERE site_id = p_site_id
    AND entry_time >= p_start_date
    AND entry_time <= p_end_date;

  -- Construir resultado JSON
  SELECT json_build_object(
    'metrics', json_build_object(
      'totalSessions', v_session_count,
      'uniqueVisitors', v_unique_visitors,
      'newVisitors', v_unique_visitors,
      'returningVisitors', 0,
      'avgDuration', ROUND(v_avg_duration),
      'avgPagesPerSession', ROUND(v_avg_pages::numeric, 2),
      'engagementRate', CASE WHEN v_session_count > 0 
        THEN ROUND(((v_session_count - v_bounce_count)::numeric / v_session_count) * 100, 1) 
        ELSE 0 END,
      'bounceRate', CASE WHEN v_session_count > 0 
        THEN ROUND((v_bounce_count::numeric / v_session_count) * 100, 2) 
        ELSE 0 END
    ),
    'topEntryPages', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT entry_page_url as page_url, COUNT(*)::bigint as entries, 0::bigint as exits
        FROM rank_rent_sessions
        WHERE site_id = p_site_id
          AND entry_time >= p_start_date
          AND entry_time <= p_end_date
        GROUP BY entry_page_url
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::json),
    'topExitPages', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT exit_page_url as page_url, COUNT(*)::bigint as exits, 0::bigint as entries
        FROM rank_rent_sessions
        WHERE site_id = p_site_id
          AND entry_time >= p_start_date
          AND entry_time <= p_end_date
          AND exit_page_url IS NOT NULL
        GROUP BY exit_page_url
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;