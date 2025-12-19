-- Create RPC function to get plan distribution with aggregated counts
CREATE OR REPLACE FUNCTION public.get_plan_distribution()
RETURNS TABLE (
  plan_name TEXT,
  user_count BIGINT,
  sites_count BIGINT,
  pages_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(sp.name, 'Sem Plano') as plan_name,
    COUNT(DISTINCT us.user_id) as user_count,
    COUNT(DISTINCT rs.id) as sites_count,
    COUNT(DISTINCT rp.id) as pages_count
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  LEFT JOIN rank_rent_sites rs ON rs.owner_user_id = us.user_id
  LEFT JOIN rank_rent_pages rp ON rp.site_id = rs.id
  WHERE us.status = 'active'
  GROUP BY sp.name
  ORDER BY user_count DESC;
$$;