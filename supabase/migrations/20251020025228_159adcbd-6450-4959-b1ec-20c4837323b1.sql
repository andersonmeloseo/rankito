-- Create aggregated view for client portal status
CREATE OR REPLACE VIEW client_portal_status AS
SELECT 
  c.id as client_id,
  c.user_id,
  c.name as client_name,
  c.email,
  c.phone,
  c.company,
  c.niche,
  c.notes,
  c.contract_start_date,
  c.contract_end_date,
  c.created_at,
  c.updated_at,
  
  -- Portal Status
  cpa.enabled as portal_enabled,
  cpa.portal_token,
  cpa.created_at as portal_created_at,
  
  -- End Client Access
  c.end_client_user_id,
  p.email as end_client_email,
  p.is_active as end_client_active,
  
  -- Analytics (últimos 30 dias)
  COALESCE(
    (SELECT COUNT(DISTINCT conv.id) 
     FROM rank_rent_conversions conv
     JOIN rank_rent_sites s ON conv.site_id = s.id
     WHERE s.client_id = c.id 
     AND conv.created_at >= NOW() - INTERVAL '30 days'),
    0
  ) as conversions_30d,
  
  COALESCE(
    (SELECT COUNT(DISTINCT conv.id) 
     FROM rank_rent_conversions conv
     JOIN rank_rent_sites s ON conv.site_id = s.id
     WHERE s.client_id = c.id 
     AND conv.event_type = 'page_view'
     AND conv.created_at >= NOW() - INTERVAL '30 days'),
    0
  ) as page_views_30d,
  
  -- Métricas agregadas
  COALESCE(
    (SELECT COUNT(DISTINCT s.id) 
     FROM rank_rent_sites s 
     WHERE s.client_id = c.id AND s.is_rented = true),
    0
  ) as total_sites,
  
  COALESCE(
    (SELECT COUNT(DISTINCT pg.id) 
     FROM rank_rent_pages pg 
     WHERE pg.client_id = c.id AND pg.is_rented = true),
    0
  ) as total_pages,
  
  COALESCE(
    (SELECT SUM(s.monthly_rent_value) 
     FROM rank_rent_sites s 
     WHERE s.client_id = c.id AND s.is_rented = true),
    0
  ) as total_monthly_value

FROM rank_rent_clients c
LEFT JOIN client_portal_analytics cpa ON c.id = cpa.client_id
LEFT JOIN profiles p ON c.end_client_user_id = p.id;

-- Grant access to authenticated users
GRANT SELECT ON client_portal_status TO authenticated;