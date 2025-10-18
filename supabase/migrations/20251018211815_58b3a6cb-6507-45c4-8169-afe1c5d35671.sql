
-- Drop existing view
DROP VIEW IF EXISTS rank_rent_site_metrics;

-- Recreate view with optimized query structure
CREATE VIEW rank_rent_site_metrics 
WITH (security_barrier = true, security_invoker = true)
AS
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
  -- Use subqueries for better performance
  (SELECT COUNT(DISTINCT id) FROM rank_rent_pages WHERE site_id = s.id) AS total_pages,
  (SELECT COUNT(*) FROM rank_rent_conversions WHERE site_id = s.id AND event_type = 'page_view') AS total_page_views,
  (SELECT COUNT(*) FROM rank_rent_conversions WHERE site_id = s.id AND event_type != 'page_view') AS total_conversions,
  -- Calculate conversion rate
  CASE 
    WHEN (SELECT COUNT(*) FROM rank_rent_conversions WHERE site_id = s.id AND event_type = 'page_view') > 0 
    THEN ROUND(
      (SELECT COUNT(*) FROM rank_rent_conversions WHERE site_id = s.id AND event_type != 'page_view')::numeric / 
      (SELECT COUNT(*) FROM rank_rent_conversions WHERE site_id = s.id AND event_type = 'page_view')::numeric * 100, 
      2
    )
    ELSE 0 
  END AS conversion_rate
FROM rank_rent_sites s
LEFT JOIN rank_rent_clients c ON c.id = s.client_id
WHERE s.user_id = auth.uid();

-- Add composite index for better performance on conversions
CREATE INDEX IF NOT EXISTS idx_conversions_site_type 
ON rank_rent_conversions(site_id, event_type);

-- Add index for user_id on sites for faster filtering
CREATE INDEX IF NOT EXISTS idx_sites_user_id 
ON rank_rent_sites(user_id) 
WHERE user_id IS NOT NULL;
