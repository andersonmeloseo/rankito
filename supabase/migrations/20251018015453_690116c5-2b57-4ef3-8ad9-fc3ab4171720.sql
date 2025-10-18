-- Recreate rank_rent_metrics view to include tracking_token
DROP VIEW IF EXISTS rank_rent_metrics;

CREATE VIEW rank_rent_metrics AS
SELECT 
  s.id as site_id,
  s.site_name,
  s.site_url,
  s.niche,
  s.location,
  s.is_rented,
  s.monthly_rent_value,
  s.client_name,
  s.tracking_pixel_installed,
  s.tracking_token,
  s.user_id,
  s.created_at,
  s.updated_at,
  COALESCE(metrics.total_page_views, 0) as total_page_views,
  COALESCE(metrics.total_conversions, 0) as total_conversions,
  COALESCE(metrics.unique_pages_with_traffic, 0) as unique_pages_with_traffic,
  CASE 
    WHEN COALESCE(metrics.total_page_views, 0) > 0 
    THEN ROUND((COALESCE(metrics.total_conversions, 0)::numeric / metrics.total_page_views::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  metrics.last_conversion_at
FROM rank_rent_sites s
LEFT JOIN (
  SELECT 
    site_id,
    COUNT(*) as total_page_views,
    COUNT(*) as total_conversions,
    COUNT(DISTINCT page_id) as unique_pages_with_traffic,
    MAX(created_at) as last_conversion_at
  FROM rank_rent_conversions
  GROUP BY site_id
) metrics ON s.id = metrics.site_id;

-- Enable pg_cron extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to check plugin status every 5 minutes
SELECT cron.schedule(
  'check-plugin-status-every-5-minutes',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-plugin-status',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM"}'::jsonb
  ) as request_id;
  $$
);