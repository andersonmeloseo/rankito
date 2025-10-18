
-- Drop existing view
DROP VIEW IF EXISTS rank_rent_site_metrics;

-- Recreate view with CTE for maximum performance
CREATE VIEW rank_rent_site_metrics 
WITH (security_barrier = true, security_invoker = true)
AS
WITH conversion_stats AS (
  SELECT 
    site_id,
    COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
    COUNT(*) FILTER (WHERE event_type != 'page_view') AS conversions
  FROM rank_rent_conversions
  GROUP BY site_id
),
page_counts AS (
  SELECT 
    site_id,
    COUNT(DISTINCT id) AS total_pages
  FROM rank_rent_pages
  GROUP BY site_id
)
SELECT 
  s.id,
  s.site_name,
  s.site_url,
  s.niche,
  s.location,
  s.is_rented,
  s.monthly_rent_value,
  s.contract_status,
  s.payment_status,
  s.contract_start_date,
  s.contract_end_date,
  s.next_payment_date,
  s.auto_renew,
  s.tracking_token,
  s.tracking_pixel_installed,
  s.notes,
  s.user_id,
  s.created_at,
  s.updated_at,
  s.client_id,
  c.name AS client_name,
  c.email AS client_email,
  c.phone AS client_phone,
  c.company AS client_company,
  COALESCE(pc.total_pages, 0) AS total_pages,
  COALESCE(cs.page_views, 0) AS total_page_views,
  COALESCE(cs.conversions, 0) AS total_conversions,
  CASE 
    WHEN COALESCE(cs.page_views, 0) > 0 
    THEN ROUND((cs.conversions::numeric / cs.page_views::numeric) * 100, 2)
    ELSE 0 
  END AS conversion_rate
FROM rank_rent_sites s
LEFT JOIN rank_rent_clients c ON c.id = s.client_id
LEFT JOIN conversion_stats cs ON cs.site_id = s.id
LEFT JOIN page_counts pc ON pc.site_id = s.id
WHERE s.user_id = auth.uid();
