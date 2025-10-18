-- Drop existing view
DROP VIEW IF EXISTS rank_rent_site_metrics;

-- Recreate view with security filter built-in
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
  COUNT(DISTINCT p.id) AS total_pages,
  COALESCE(SUM(CASE WHEN conv.event_type = 'page_view' THEN 1 ELSE 0 END), 0) AS total_page_views,
  COALESCE(SUM(CASE WHEN conv.event_type != 'page_view' THEN 1 ELSE 0 END), 0) AS total_conversions,
  CASE 
    WHEN SUM(CASE WHEN conv.event_type = 'page_view' THEN 1 ELSE 0 END) > 0 
    THEN ROUND((SUM(CASE WHEN conv.event_type != 'page_view' THEN 1 ELSE 0 END)::numeric / 
                SUM(CASE WHEN conv.event_type = 'page_view' THEN 1 ELSE 0 END)::numeric) * 100, 2)
    ELSE 0 
  END AS conversion_rate
FROM rank_rent_sites s
LEFT JOIN rank_rent_clients c ON c.id = s.client_id
LEFT JOIN rank_rent_pages p ON p.site_id = s.id
LEFT JOIN rank_rent_conversions conv ON conv.site_id = s.id
WHERE s.user_id = auth.uid()
GROUP BY s.id, c.id, c.name, c.email, c.phone, c.company;