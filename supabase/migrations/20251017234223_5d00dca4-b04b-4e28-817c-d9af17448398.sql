-- Create enum for event types
CREATE TYPE event_type AS ENUM ('page_view', 'phone_click', 'email_click', 'whatsapp_click', 'form_submit', 'button_click');

-- Create rank_rent_sites table
CREATE TABLE public.rank_rent_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL UNIQUE,
  site_url TEXT NOT NULL,
  niche TEXT NOT NULL,
  location TEXT NOT NULL,
  monthly_rent_value NUMERIC DEFAULT 0,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  is_rented BOOLEAN DEFAULT FALSE,
  contract_start_date DATE,
  contract_end_date DATE,
  tracking_pixel_installed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rank_rent_conversions table
CREATE TABLE public.rank_rent_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  event_type event_type NOT NULL,
  cta_text TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rank_rent_pricing_rules table
CREATE TABLE public.rank_rent_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  location_type TEXT NOT NULL,
  min_monthly_conversions INTEGER NOT NULL,
  max_monthly_conversions INTEGER,
  suggested_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sites_user ON rank_rent_sites(user_id);
CREATE INDEX idx_sites_niche ON rank_rent_sites(niche);
CREATE INDEX idx_sites_location ON rank_rent_sites(location);
CREATE INDEX idx_sites_rented ON rank_rent_sites(is_rented);

CREATE INDEX idx_conversions_site ON rank_rent_conversions(site_id);
CREATE INDEX idx_conversions_date ON rank_rent_conversions(created_at DESC);
CREATE INDEX idx_conversions_type ON rank_rent_conversions(event_type);
CREATE INDEX idx_conversions_page ON rank_rent_conversions(page_path);

CREATE INDEX idx_pricing_user ON rank_rent_pricing_rules(user_id);
CREATE INDEX idx_pricing_niche ON rank_rent_pricing_rules(niche);

-- Create view for aggregated metrics
CREATE VIEW rank_rent_metrics AS
SELECT 
  s.id AS site_id,
  s.user_id,
  s.site_name,
  s.site_url,
  s.niche,
  s.location,
  s.monthly_rent_value,
  s.is_rented,
  s.client_name,
  s.tracking_pixel_installed,
  COUNT(c.id) FILTER (WHERE c.event_type = 'page_view') AS total_page_views,
  COUNT(c.id) FILTER (WHERE c.event_type != 'page_view') AS total_conversions,
  COUNT(DISTINCT c.page_path) AS unique_pages_with_traffic,
  ROUND(
    (COUNT(c.id) FILTER (WHERE c.event_type != 'page_view')::NUMERIC / 
     NULLIF(COUNT(c.id) FILTER (WHERE c.event_type = 'page_view'), 0) * 100)::NUMERIC, 
    2
  ) AS conversion_rate,
  MAX(c.created_at) AS last_conversion_at,
  s.created_at,
  s.updated_at
FROM rank_rent_sites s
LEFT JOIN rank_rent_conversions c ON s.id = c.site_id
GROUP BY s.id;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rank_rent_sites
CREATE TRIGGER update_rank_rent_sites_updated_at
BEFORE UPDATE ON rank_rent_sites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE rank_rent_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_rent_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_rent_pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rank_rent_sites
CREATE POLICY "Users can view own sites"
ON rank_rent_sites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites"
ON rank_rent_sites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
ON rank_rent_sites FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
ON rank_rent_sites FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for rank_rent_conversions
CREATE POLICY "Users can view conversions from own sites"
ON rank_rent_conversions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_conversions.site_id
    AND rank_rent_sites.user_id = auth.uid()
  )
);

-- Note: INSERT policy for conversions will be handled by edge function using service role

-- RLS Policies for rank_rent_pricing_rules
CREATE POLICY "Users can view own pricing rules"
ON rank_rent_pricing_rules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pricing rules"
ON rank_rent_pricing_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pricing rules"
ON rank_rent_pricing_rules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pricing rules"
ON rank_rent_pricing_rules FOR DELETE
USING (auth.uid() = user_id);