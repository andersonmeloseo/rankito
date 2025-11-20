-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule system health check (every 2 hours)
SELECT cron.schedule(
  'check-system-health-alerts',
  '0 */2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-system-health',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule expiring trials check (daily at 9 AM)
SELECT cron.schedule(
  'check-expiring-trials-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-expiring-trials',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule GSC quota check (every 4 hours)
SELECT cron.schedule(
  'check-gsc-quota-exceeded',
  '0 */4 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-gsc-quota-exceeded',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Create function to manually trigger all notification checks (useful for testing)
CREATE OR REPLACE FUNCTION trigger_all_notification_checks()
RETURNS TABLE(job_name text, result text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'System Health'::text,
    'Triggered'::text;
  
  PERFORM net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-system-health',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RETURN QUERY
  SELECT 
    'Expiring Trials'::text,
    'Triggered'::text;
  
  PERFORM net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-expiring-trials',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RETURN QUERY
  SELECT 
    'GSC Quota Check'::text,
    'Triggered'::text;
  
  PERFORM net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/check-gsc-quota-exceeded',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;
