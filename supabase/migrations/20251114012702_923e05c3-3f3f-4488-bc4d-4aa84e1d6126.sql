-- Função 1: Distribuição de Eventos
CREATE OR REPLACE FUNCTION get_event_distribution(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  device_filter TEXT DEFAULT 'all'
)
RETURNS TABLE(event_type TEXT, count BIGINT) AS $$
BEGIN
  IF device_filter = 'all' THEN
    RETURN QUERY
    SELECT 
      rc.event_type::TEXT,
      COUNT(*)::BIGINT as count
    FROM rank_rent_conversions rc
    WHERE rc.site_id = site_uuid
      AND rc.created_at >= start_date
      AND rc.created_at <= end_date
    GROUP BY rc.event_type;
  ELSE
    RETURN QUERY
    SELECT 
      rc.event_type::TEXT,
      COUNT(*)::BIGINT as count
    FROM rank_rent_conversions rc
    WHERE rc.site_id = site_uuid
      AND rc.created_at >= start_date
      AND rc.created_at <= end_date
      AND rc.metadata->>'device' = device_filter
    GROUP BY rc.event_type;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função 2: Métricas do Funil
CREATE OR REPLACE FUNCTION get_funnel_metrics(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  device_filter TEXT DEFAULT 'all'
)
RETURNS TABLE(
  page_views BIGINT,
  interactions BIGINT,
  conversions BIGINT
) AS $$
DECLARE
  pv_count BIGINT;
  conv_count BIGINT;
BEGIN
  -- Contar page views
  IF device_filter = 'all' THEN
    SELECT COUNT(*) INTO pv_count
    FROM rank_rent_conversions
    WHERE site_id = site_uuid
      AND event_type = 'page_view'
      AND created_at >= start_date
      AND created_at <= end_date;
  ELSE
    SELECT COUNT(*) INTO pv_count
    FROM rank_rent_conversions
    WHERE site_id = site_uuid
      AND event_type = 'page_view'
      AND created_at >= start_date
      AND created_at <= end_date
      AND metadata->>'device' = device_filter;
  END IF;

  -- Contar conversões
  IF device_filter = 'all' THEN
    SELECT COUNT(*) INTO conv_count
    FROM rank_rent_conversions
    WHERE site_id = site_uuid
      AND event_type != 'page_view'
      AND created_at >= start_date
      AND created_at <= end_date;
  ELSE
    SELECT COUNT(*) INTO conv_count
    FROM rank_rent_conversions
    WHERE site_id = site_uuid
      AND event_type != 'page_view'
      AND created_at >= start_date
      AND created_at <= end_date
      AND metadata->>'device' = device_filter;
  END IF;

  RETURN QUERY SELECT pv_count, conv_count, conv_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Função 3: Top Páginas
CREATE OR REPLACE FUNCTION get_top_pages(
  site_uuid UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  device_filter TEXT DEFAULT 'all',
  limit_count INT DEFAULT 100
)
RETURNS TABLE(
  page TEXT,
  page_views BIGINT,
  conversions BIGINT
) AS $$
BEGIN
  IF device_filter = 'all' THEN
    RETURN QUERY
    SELECT 
      rc.page_path as page,
      COUNT(*) FILTER (WHERE rc.event_type = 'page_view')::BIGINT as page_views,
      COUNT(*) FILTER (WHERE rc.event_type != 'page_view')::BIGINT as conversions
    FROM rank_rent_conversions rc
    WHERE rc.site_id = site_uuid
      AND rc.created_at >= start_date
      AND rc.created_at <= end_date
    GROUP BY rc.page_path
    ORDER BY page_views DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT 
      rc.page_path as page,
      COUNT(*) FILTER (WHERE rc.event_type = 'page_view')::BIGINT as page_views,
      COUNT(*) FILTER (WHERE rc.event_type != 'page_view')::BIGINT as conversions
    FROM rank_rent_conversions rc
    WHERE rc.site_id = site_uuid
      AND rc.created_at >= start_date
      AND rc.created_at <= end_date
      AND rc.metadata->>'device' = device_filter
    GROUP BY rc.page_path
    ORDER BY page_views DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;