-- RPC 1: Otimização de useSubscriptionLimits (elimina N+1 queries)
CREATE OR REPLACE FUNCTION get_subscription_limits_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'subscription', (
      SELECT row_to_json(sub)
      FROM (
        SELECT us.*, sp.name, sp.slug, sp.max_sites, sp.max_pages_per_site
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = p_user_id AND us.status = 'active'
        ORDER BY us.created_at DESC
        LIMIT 1
      ) sub
    ),
    'sites_count', (
      SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id
    ),
    'pages_per_site', (
      SELECT COALESCE(json_object_agg(site_id, page_count), '{}'::json)
      FROM (
        SELECT s.id as site_id, COUNT(p.id) as page_count
        FROM rank_rent_sites s
        LEFT JOIN rank_rent_pages p ON p.site_id = s.id
        WHERE s.owner_user_id = p_user_id
        GROUP BY s.id
      ) counts
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- RPC 2: Dashboard Overview consolidado (elimina múltiplas queries)
CREATE OR REPLACE FUNCTION get_dashboard_overview(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sites', (SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id),
    'rented_sites', (SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id AND is_rented = true),
    'available_sites', (SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id AND is_rented = false),
    'monthly_revenue', (SELECT COALESCE(SUM(monthly_rent_value), 0) FROM rank_rent_sites WHERE owner_user_id = p_user_id AND is_rented = true),
    'total_conversions', (
      SELECT COALESCE(SUM(m.total_conversions), 0)::BIGINT
      FROM rank_rent_site_metrics_cache m
      JOIN rank_rent_sites s ON m.site_id = s.id
      WHERE s.owner_user_id = p_user_id
    ),
    'expiring_contracts', (
      SELECT COUNT(*) FROM rank_rent_sites 
      WHERE owner_user_id = p_user_id 
      AND is_rented = true 
      AND contract_end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
    ),
    'occupancy_rate', (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 0 
        ELSE ROUND((COUNT(*) FILTER (WHERE is_rented = true)::numeric / COUNT(*)::numeric) * 100)
      END
      FROM rank_rent_sites WHERE owner_user_id = p_user_id
    ),
    'average_ticket', (
      SELECT CASE 
        WHEN COUNT(*) FILTER (WHERE is_rented = true) = 0 THEN 0 
        ELSE COALESCE(SUM(monthly_rent_value) / NULLIF(COUNT(*) FILTER (WHERE is_rented = true), 0), 0)
      END
      FROM rank_rent_sites WHERE owner_user_id = p_user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;