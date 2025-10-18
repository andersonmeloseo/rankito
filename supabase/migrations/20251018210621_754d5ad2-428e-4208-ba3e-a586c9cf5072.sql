-- Create comprehensive site metrics view
CREATE OR REPLACE VIEW rank_rent_site_metrics AS
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
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  c.company as client_company,
  COUNT(DISTINCT p.id) as total_pages,
  COALESCE(SUM(CASE WHEN conv.event_type = 'page_view' THEN 1 ELSE 0 END), 0) as total_page_views,
  COALESCE(SUM(CASE WHEN conv.event_type != 'page_view' THEN 1 ELSE 0 END), 0) as total_conversions,
  CASE 
    WHEN SUM(CASE WHEN conv.event_type = 'page_view' THEN 1 ELSE 0 END) > 0 
    THEN ROUND(
      (SUM(CASE WHEN conv.event_type != 'page_view' THEN 1 ELSE 0 END)::numeric / 
       SUM(CASE WHEN conv.event_type = 'page_view' THEN 1 ELSE 0 END)::numeric) * 100, 
      2
    )
    ELSE 0
  END as conversion_rate
FROM rank_rent_sites s
LEFT JOIN rank_rent_clients c ON c.id = s.client_id
LEFT JOIN rank_rent_pages p ON p.site_id = s.id
LEFT JOIN rank_rent_conversions conv ON conv.site_id = s.id
GROUP BY s.id, c.id, c.name, c.email, c.phone, c.company;