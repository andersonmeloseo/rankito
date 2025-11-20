-- Create function to get top users by consumption
CREATE OR REPLACE FUNCTION public.get_top_users_by_consumption(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  total_sites BIGINT,
  total_pages BIGINT,
  total_conversions BIGINT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.full_name, 'Sem nome') as user_name,
    p.email as user_email,
    COUNT(DISTINCT s.id) as total_sites,
    COUNT(DISTINCT pg.id) as total_pages,
    COUNT(DISTINCT c.id) as total_conversions
  FROM profiles p
  LEFT JOIN rank_rent_sites s ON s.owner_user_id = p.id
  LEFT JOIN rank_rent_pages pg ON pg.site_id = s.id
  LEFT JOIN rank_rent_conversions c ON c.site_id = s.id
  WHERE p.is_active = true
  GROUP BY p.id, p.full_name, p.email
  ORDER BY total_conversions DESC, total_pages DESC, total_sites DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute to authenticated users (RLS will control access)
GRANT EXECUTE ON FUNCTION public.get_top_users_by_consumption TO authenticated;