-- Drop e recriar view rank_rent_page_metrics com novas métricas
DROP VIEW IF EXISTS rank_rent_page_metrics CASCADE;

CREATE VIEW rank_rent_page_metrics
WITH (security_invoker=on) AS
SELECT 
  p.id AS page_id,
  p.site_id,
  p.client_id,
  p.page_url,
  p.page_path,
  p.page_title,
  p.phone_number,
  p.monthly_rent_value,
  p.is_rented,
  p.status,
  s.site_name,
  c.name AS client_name,
  
  -- Métricas de tráfego
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS total_page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS total_conversions,
  ROUND(
    (COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view')::NUMERIC / 
     NULLIF(COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view'), 0) * 100)::NUMERIC, 
    2
  ) AS conversion_rate,
  MAX(conv.created_at) AS last_conversion_at,
  
  -- NOVAS: Métricas de engagement por URL
  ROUND(AVG((conv.metadata->>'time_on_page')::integer)) AS avg_time_on_page,
  ROUND(AVG((conv.metadata->>'engagement_score')::integer)) AS avg_engagement_score,
  ROUND(AVG((conv.metadata->>'scroll_depth')::integer)) AS avg_scroll_depth,
  ROUND(AVG((conv.metadata->>'total_time')::integer)) AS avg_total_time,
  
  p.created_at,
  p.updated_at
FROM rank_rent_pages p
LEFT JOIN rank_rent_sites s ON p.site_id = s.id
LEFT JOIN rank_rent_clients c ON p.client_id = c.id
LEFT JOIN rank_rent_conversions conv ON p.id = conv.page_id
GROUP BY p.id, s.site_name, c.name;