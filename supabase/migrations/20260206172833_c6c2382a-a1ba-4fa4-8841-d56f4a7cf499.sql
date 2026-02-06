-- Criar RPC otimizada para buscar sites com métricas do cache
CREATE OR REPLACE FUNCTION get_sites_with_metrics(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  site_name TEXT,
  site_url TEXT,
  niche TEXT,
  location TEXT,
  monthly_rent_value NUMERIC,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  is_rented BOOLEAN,
  contract_start_date DATE,
  contract_end_date DATE,
  tracking_pixel_installed BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tracking_token TEXT,
  client_id UUID,
  contract_status TEXT,
  payment_status TEXT,
  next_payment_date DATE,
  auto_renew BOOLEAN,
  owner_user_id UUID,
  indexnow_key TEXT,
  indexnow_validated BOOLEAN,
  is_ecommerce BOOLEAN,
  total_pages BIGINT,
  total_page_views BIGINT,
  total_conversions BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.site_name,
    s.site_url,
    s.niche,
    s.location,
    s.monthly_rent_value,
    s.client_name,
    s.client_email,
    s.client_phone,
    s.is_rented,
    s.contract_start_date,
    s.contract_end_date,
    s.tracking_pixel_installed,
    s.notes,
    s.created_at,
    s.updated_at,
    s.tracking_token,
    s.client_id,
    s.contract_status,
    s.payment_status,
    s.next_payment_date,
    s.auto_renew,
    s.owner_user_id,
    s.indexnow_key,
    s.indexnow_validated,
    s.is_ecommerce,
    COALESCE(pc.page_count, 0)::BIGINT AS total_pages,
    COALESCE(m.total_page_views, 0)::BIGINT,
    COALESCE(m.total_conversions, 0)::BIGINT,
    CASE 
      WHEN COALESCE(m.total_page_views, 0) > 0 
      THEN ROUND((COALESCE(m.total_conversions, 0)::NUMERIC / m.total_page_views) * 100, 2)
      ELSE 0
    END AS conversion_rate
  FROM rank_rent_sites s
  LEFT JOIN rank_rent_site_metrics_cache m ON m.site_id = s.id
  LEFT JOIN (
    SELECT site_id, COUNT(*) AS page_count
    FROM rank_rent_pages
    GROUP BY site_id
  ) pc ON pc.site_id = s.id
  WHERE s.owner_user_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$;