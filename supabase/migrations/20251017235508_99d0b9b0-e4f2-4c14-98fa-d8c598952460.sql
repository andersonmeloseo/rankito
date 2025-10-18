-- Fix security definer views by explicitly setting security invoker
DROP VIEW IF EXISTS rank_rent_page_metrics;
DROP VIEW IF EXISTS rank_rent_client_metrics;
DROP VIEW IF EXISTS rank_rent_daily_stats;
DROP VIEW IF EXISTS rank_rent_metrics;

-- Recreate views with SECURITY INVOKER
CREATE OR REPLACE VIEW rank_rent_page_metrics
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
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS total_page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS total_conversions,
  ROUND(
    (COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view')::NUMERIC / 
     NULLIF(COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view'), 0) * 100)::NUMERIC, 
    2
  ) AS conversion_rate,
  MAX(conv.created_at) AS last_conversion_at,
  p.created_at,
  p.updated_at
FROM rank_rent_pages p
LEFT JOIN rank_rent_sites s ON p.site_id = s.id
LEFT JOIN rank_rent_clients c ON p.client_id = c.id
LEFT JOIN rank_rent_conversions conv ON p.id = conv.page_id
GROUP BY p.id, s.site_name, c.name;

CREATE OR REPLACE VIEW rank_rent_client_metrics
WITH (security_invoker=on) AS
SELECT 
  c.id AS client_id,
  c.name AS client_name,
  c.email,
  c.phone,
  c.company,
  c.contract_start_date,
  c.contract_end_date,
  c.access_token,
  COUNT(p.id) AS total_pages_rented,
  COALESCE(SUM(p.monthly_rent_value), 0) AS total_monthly_value,
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS total_page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS total_conversions,
  c.created_at,
  c.updated_at
FROM rank_rent_clients c
LEFT JOIN rank_rent_pages p ON c.id = p.client_id AND p.is_rented = TRUE
LEFT JOIN rank_rent_conversions conv ON p.id = conv.page_id
GROUP BY c.id;

CREATE OR REPLACE VIEW rank_rent_daily_stats
WITH (security_invoker=on) AS
SELECT 
  DATE(conv.created_at) AS date,
  p.site_id,
  p.id AS page_id,
  p.client_id,
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS conversions
FROM rank_rent_conversions conv
LEFT JOIN rank_rent_pages p ON conv.page_id = p.id
GROUP BY DATE(conv.created_at), p.site_id, p.id, p.client_id
ORDER BY date DESC;

CREATE OR REPLACE VIEW rank_rent_metrics
WITH (security_invoker=on) AS
SELECT 
  s.id AS site_id,
  s.user_id,
  s.site_name,
  s.site_url,
  s.niche,
  s.location,
  s.monthly_rent_value,
  s.is_rented,
  s.client_name,
  s.tracking_pixel_installed,
  COUNT(c.id) FILTER (WHERE c.event_type = 'page_view') AS total_page_views,
  COUNT(c.id) FILTER (WHERE c.event_type != 'page_view') AS total_conversions,
  COUNT(DISTINCT c.page_path) AS unique_pages_with_traffic,
  ROUND(
    (COUNT(c.id) FILTER (WHERE c.event_type != 'page_view')::NUMERIC / 
     NULLIF(COUNT(c.id) FILTER (WHERE c.event_type = 'page_view'), 0) * 100)::NUMERIC, 
    2
  ) AS conversion_rate,
  MAX(c.created_at) AS last_conversion_at,
  s.created_at,
  s.updated_at
FROM rank_rent_sites s
LEFT JOIN rank_rent_conversions c ON s.id = c.site_id
GROUP BY s.id;

-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;