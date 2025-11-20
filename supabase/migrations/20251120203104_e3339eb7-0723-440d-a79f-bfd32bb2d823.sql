-- Create geolocation API configs table
CREATE TABLE geolocation_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL CHECK (provider_name IN ('ipgeolocation', 'ipapi', 'ipstack', 'ipinfo')),
  api_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  monthly_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_rotation_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_display_name UNIQUE(display_name),
  CONSTRAINT unique_api_key UNIQUE(api_key)
);

-- Enable RLS
ALTER TABLE geolocation_api_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for super admin
CREATE POLICY "Super admin can manage geolocation APIs"
  ON geolocation_api_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_geolocation_api_configs_updated_at
  BEFORE UPDATE ON geolocation_api_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance with hundreds of records
CREATE INDEX idx_geolocation_apis_active 
  ON geolocation_api_configs(is_active, last_rotation_at);
  
CREATE INDEX idx_geolocation_apis_provider 
  ON geolocation_api_configs(provider_name, is_active);
  
CREATE INDEX idx_geolocation_apis_priority 
  ON geolocation_api_configs(priority, is_active);