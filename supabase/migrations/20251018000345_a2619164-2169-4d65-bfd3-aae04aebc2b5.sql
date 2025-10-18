-- Drop and recreate the rank_rent_client_metrics view to include niche field
DROP VIEW IF EXISTS rank_rent_client_metrics;

CREATE VIEW rank_rent_client_metrics
WITH (security_invoker = true) AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.email,
  c.phone,
  c.company,
  c.niche,
  c.contract_start_date,
  c.contract_end_date,
  c.created_at,
  c.updated_at,
  c.access_token,
  COUNT(DISTINCT p.id) as total_pages_rented,
  COALESCE(SUM(p.monthly_rent_value), 0) as total_monthly_value,
  COALESCE(SUM(pm.total_page_views), 0) as total_page_views,
  COALESCE(SUM(pm.total_conversions), 0) as total_conversions
FROM rank_rent_clients c
LEFT JOIN rank_rent_pages p ON p.client_id = c.id
LEFT JOIN rank_rent_page_metrics pm ON pm.page_id = p.id
GROUP BY c.id, c.name, c.email, c.phone, c.company, c.niche, 
         c.contract_start_date, c.contract_end_date, c.created_at, 
         c.updated_at, c.access_token;