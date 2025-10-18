-- Update all views to use SECURITY INVOKER to respect RLS policies
ALTER VIEW rank_rent_metrics SET (security_invoker = on);
ALTER VIEW rank_rent_page_metrics SET (security_invoker = on);
ALTER VIEW rank_rent_client_metrics SET (security_invoker = on);
ALTER VIEW rank_rent_daily_stats SET (security_invoker = on);