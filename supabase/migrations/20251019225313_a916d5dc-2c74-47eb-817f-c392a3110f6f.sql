-- Drop the existing view
DROP VIEW IF EXISTS rank_rent_metrics;

-- Recreate the view with correct page_views and conversions calculation
CREATE VIEW rank_rent_metrics AS
SELECT 
  s.id as site_id,
  s.site_name,
  s.site_url,
  s.niche,
  s.location,
  s.is_rented,
  s.monthly_rent_value,
  s.client_id,
  s.tracking_token,
  s.tracking_pixel_installed,
  s.created_at,
  s.updated_at,
  s.owner_user_id as user_id,
  c.name as client_name,
  COALESCE(metrics.total_page_views, 0) as total_page_views,
  COALESCE(metrics.total_conversions, 0) as total_conversions,
  COALESCE(metrics.unique_pages_with_traffic, 0) as unique_pages_with_traffic,
  CASE 
    WHEN COALESCE(metrics.total_page_views, 0) > 0 
    THEN ROUND((COALESCE(metrics.total_conversions, 0)::numeric / metrics.total_page_views::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  metrics.last_conversion_at
FROM rank_rent_sites s
LEFT JOIN rank_rent_clients c ON s.client_id = c.id
LEFT JOIN (
  SELECT 
    site_id,
    COUNT(*) FILTER (WHERE event_type = 'page_view') as total_page_views,
    COUNT(*) FILTER (WHERE event_type != 'page_view') as total_conversions,
    COUNT(DISTINCT page_id) as unique_pages_with_traffic,
    MAX(created_at) FILTER (WHERE event_type != 'page_view') as last_conversion_at
  FROM rank_rent_conversions
  GROUP BY site_id
) metrics ON s.id = metrics.site_id;