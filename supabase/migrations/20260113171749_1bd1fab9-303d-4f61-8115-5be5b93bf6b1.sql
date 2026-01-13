-- Recriar view rank_rent_metrics para usar cache
DROP VIEW IF EXISTS public.rank_rent_metrics CASCADE;

CREATE VIEW public.rank_rent_metrics AS
SELECT 
  s.id AS site_id,
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
  s.owner_user_id AS user_id,
  c.name AS client_name,
  COALESCE(m.total_page_views, 0) AS total_page_views,
  COALESCE(m.total_conversions, 0) AS total_conversions,
  COALESCE(m.unique_pages_with_traffic, 0) AS unique_pages_with_traffic,
  CASE 
    WHEN COALESCE(m.total_page_views, 0) > 0 
    THEN ROUND((COALESCE(m.total_conversions, 0)::numeric / m.total_page_views::numeric) * 100, 2)
    ELSE 0 
  END AS conversion_rate,
  m.last_conversion_at
FROM public.rank_rent_sites s
LEFT JOIN public.rank_rent_clients c ON s.client_id = c.id
LEFT JOIN public.rank_rent_site_metrics_cache m ON s.id = m.site_id;

-- Conceder permissões na view
GRANT SELECT ON public.rank_rent_metrics TO authenticated;