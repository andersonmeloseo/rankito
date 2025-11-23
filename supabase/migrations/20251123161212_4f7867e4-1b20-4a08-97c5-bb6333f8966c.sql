-- Remove OAuth2 columns from google_business_profiles
ALTER TABLE google_business_profiles 
  DROP COLUMN IF EXISTS access_token,
  DROP COLUMN IF EXISTS refresh_token,
  DROP COLUMN IF EXISTS token_expires_at;

-- Add service_account_json column
ALTER TABLE google_business_profiles
  ADD COLUMN service_account_json JSONB;

-- Make google_email optional (extracted from JSON)
ALTER TABLE google_business_profiles
  ALTER COLUMN google_email DROP NOT NULL;

-- Drop gbp_oauth_states table (no longer needed)
DROP TABLE IF EXISTS gbp_oauth_states CASCADE;

-- Update unique constraint
ALTER TABLE google_business_profiles
  DROP CONSTRAINT IF EXISTS gbp_site_connection_unique;

ALTER TABLE google_business_profiles
  ADD CONSTRAINT gbp_site_connection_unique UNIQUE(site_id, connection_name);