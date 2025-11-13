-- Add health check columns to google_search_console_integrations
ALTER TABLE google_search_console_integrations
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'unhealthy', 'checking')),
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS health_check_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER DEFAULT 0;

-- Create index for health status queries
CREATE INDEX IF NOT EXISTS idx_gsc_integrations_health 
ON google_search_console_integrations(site_id, health_status, is_active);

-- Comment on new columns
COMMENT ON COLUMN google_search_console_integrations.health_status IS 'Health status of integration: healthy, unhealthy, checking';
COMMENT ON COLUMN google_search_console_integrations.last_error IS 'Last error message from failed request';
COMMENT ON COLUMN google_search_console_integrations.health_check_at IS 'Timestamp when integration can be checked again (cooldown period)';
COMMENT ON COLUMN google_search_console_integrations.consecutive_failures IS 'Counter for consecutive authentication failures';