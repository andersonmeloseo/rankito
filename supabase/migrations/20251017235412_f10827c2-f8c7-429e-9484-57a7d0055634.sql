-- Create clients table
CREATE TABLE public.rank_rent_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pages table
CREATE TABLE public.rank_rent_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  client_id UUID REFERENCES rank_rent_clients(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL UNIQUE,
  page_path TEXT NOT NULL,
  page_title TEXT,
  phone_number TEXT,
  monthly_rent_value NUMERIC DEFAULT 0,
  is_rented BOOLEAN DEFAULT FALSE,
  cta_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'needs_review')),
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pages_site ON rank_rent_pages(site_id);
CREATE INDEX idx_pages_client ON rank_rent_pages(client_id);
CREATE INDEX idx_pages_status ON rank_rent_pages(status);
CREATE INDEX idx_pages_rented ON rank_rent_pages(is_rented);
CREATE INDEX idx_pages_url ON rank_rent_pages(page_url);

CREATE INDEX idx_clients_user ON rank_rent_clients(user_id);
CREATE INDEX idx_clients_token ON rank_rent_clients(access_token);

-- Add page_id to conversions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rank_rent_conversions' AND column_name = 'page_id'
  ) THEN
    ALTER TABLE rank_rent_conversions ADD COLUMN page_id UUID REFERENCES rank_rent_pages(id) ON DELETE SET NULL;
    CREATE INDEX idx_conversions_page_id ON rank_rent_conversions(page_id);
  END IF;
END $$;

-- Create trigger for rank_rent_clients
CREATE TRIGGER update_rank_rent_clients_updated_at
BEFORE UPDATE ON rank_rent_clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for rank_rent_pages
CREATE TRIGGER update_rank_rent_pages_updated_at
BEFORE UPDATE ON rank_rent_pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE rank_rent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_rent_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rank_rent_clients
CREATE POLICY "Users can view own clients"
ON rank_rent_clients FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
ON rank_rent_clients FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
ON rank_rent_clients FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
ON rank_rent_clients FOR DELETE
USING (auth.uid() = user_id);

-- Public access to clients via token for reports
CREATE POLICY "Public can access client data via valid token"
ON rank_rent_clients FOR SELECT
TO anon
USING (access_token IS NOT NULL);

-- RLS Policies for rank_rent_pages  
CREATE POLICY "Users can view pages from own sites"
ON rank_rent_pages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert pages to own sites"
ON rank_rent_pages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pages from own sites"
ON rank_rent_pages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pages from own sites"
ON rank_rent_pages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.user_id = auth.uid()
  )
);

-- Public access for client report pages
CREATE POLICY "Public can view pages for valid client tokens"
ON rank_rent_pages FOR SELECT
TO anon
USING (
  client_id IN (
    SELECT id FROM rank_rent_clients WHERE access_token IS NOT NULL
  )
);

-- Create views for aggregated metrics
CREATE OR REPLACE VIEW rank_rent_page_metrics AS
SELECT 
  p.id AS page_id,
  p.site_id,
  p.client_id,
  p.page_url,
  p.page_path,
  p.page_title,
  p.phone_number,
  p.monthly_rent_value,
  p.is_rented,
  p.status,
  s.site_name,
  c.name AS client_name,
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS total_page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS total_conversions,
  ROUND(
    (COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view')::NUMERIC / 
     NULLIF(COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view'), 0) * 100)::NUMERIC, 
    2
  ) AS conversion_rate,
  MAX(conv.created_at) AS last_conversion_at,
  p.created_at,
  p.updated_at
FROM rank_rent_pages p
LEFT JOIN rank_rent_sites s ON p.site_id = s.id
LEFT JOIN rank_rent_clients c ON p.client_id = c.id
LEFT JOIN rank_rent_conversions conv ON p.id = conv.page_id
GROUP BY p.id, s.site_name, c.name;

CREATE OR REPLACE VIEW rank_rent_client_metrics AS
SELECT 
  c.id AS client_id,
  c.name AS client_name,
  c.email,
  c.phone,
  c.company,
  c.contract_start_date,
  c.contract_end_date,
  c.access_token,
  COUNT(p.id) AS total_pages_rented,
  COALESCE(SUM(p.monthly_rent_value), 0) AS total_monthly_value,
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS total_page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS total_conversions,
  c.created_at,
  c.updated_at
FROM rank_rent_clients c
LEFT JOIN rank_rent_pages p ON c.id = p.client_id AND p.is_rented = TRUE
LEFT JOIN rank_rent_conversions conv ON p.id = conv.page_id
GROUP BY c.id;

CREATE OR REPLACE VIEW rank_rent_daily_stats AS
SELECT 
  DATE(conv.created_at) AS date,
  p.site_id,
  p.id AS page_id,
  p.client_id,
  COUNT(conv.id) FILTER (WHERE conv.event_type = 'page_view') AS page_views,
  COUNT(conv.id) FILTER (WHERE conv.event_type != 'page_view') AS conversions
FROM rank_rent_conversions conv
LEFT JOIN rank_rent_pages p ON conv.page_id = p.id
GROUP BY DATE(conv.created_at), p.site_id, p.id, p.client_id
ORDER BY date DESC;