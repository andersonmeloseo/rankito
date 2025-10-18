-- Add UNIQUE constraint to site_id in rank_rent_financial_config
ALTER TABLE rank_rent_financial_config 
ADD CONSTRAINT rank_rent_financial_config_site_id_key 
UNIQUE (site_id);

-- Recreate the financial metrics view with proper security settings
DROP VIEW IF EXISTS rank_rent_financial_metrics;

CREATE VIEW rank_rent_financial_metrics
WITH (security_invoker=true)
AS
SELECT 
  p.id as page_id,
  p.site_id,
  p.page_url,
  p.page_title,
  p.page_path,
  p.monthly_rent_value,
  p.is_rented,
  p.client_id,
  COALESCE(c.name, '') as client_name,
  COALESCE(COUNT(DISTINCT conv.id), 0) as total_conversions,
  COALESCE(COUNT(DISTINCT pv.id), 0) as total_page_views,
  CASE 
    WHEN COUNT(DISTINCT pv.id) > 0 
    THEN (COUNT(DISTINCT conv.id)::numeric / COUNT(DISTINCT pv.id)::numeric * 100)
    ELSE 0 
  END as conversion_rate,
  COALESCE(fc.cost_per_conversion, 0) as cost_per_conversion,
  COALESCE(fc.monthly_fixed_costs, 0) as monthly_fixed_costs,
  COALESCE(fc.acquisition_cost, 0) as acquisition_cost,
  COALESCE(fc.business_model, 'per_page') as business_model,
  p.monthly_rent_value as monthly_revenue,
  (COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id)) as monthly_conversion_costs,
  (p.monthly_rent_value - (COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id)) - COALESCE(fc.monthly_fixed_costs, 0)) as monthly_profit,
  CASE 
    WHEN (COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id) + COALESCE(fc.monthly_fixed_costs, 0) + COALESCE(fc.acquisition_cost, 0)) > 0
    THEN ((p.monthly_rent_value - (COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id)) - COALESCE(fc.monthly_fixed_costs, 0)) / 
          (COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id) + COALESCE(fc.monthly_fixed_costs, 0) + COALESCE(fc.acquisition_cost, 0)) * 100)
    ELSE 0
  END as roi_percentage,
  CASE 
    WHEN p.monthly_rent_value > 0
    THEN ((COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id) + COALESCE(fc.monthly_fixed_costs, 0)) / p.monthly_rent_value * 100)
    ELSE 0
  END as cost_revenue_ratio,
  CASE 
    WHEN p.monthly_rent_value > 0
    THEN ((p.monthly_rent_value - (COALESCE(fc.cost_per_conversion, 0) * COUNT(DISTINCT conv.id)) - COALESCE(fc.monthly_fixed_costs, 0)) / p.monthly_rent_value * 100)
    ELSE 0
  END as profit_margin,
  s.user_id
FROM rank_rent_pages p
JOIN rank_rent_sites s ON s.id = p.site_id
LEFT JOIN rank_rent_clients c ON c.id = p.client_id
LEFT JOIN rank_rent_financial_config fc ON fc.site_id = p.site_id
LEFT JOIN rank_rent_conversions conv ON conv.page_id = p.id 
  AND conv.created_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN rank_rent_conversions pv ON pv.page_id = p.id 
  AND pv.event_type = 'page_view'
  AND pv.created_at >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.is_rented = true
GROUP BY 
  p.id, p.site_id, p.page_url, p.page_title, p.page_path,
  p.monthly_rent_value, p.is_rented, p.client_id, c.name,
  fc.cost_per_conversion, fc.monthly_fixed_costs, fc.acquisition_cost, fc.business_model,
  s.user_id;