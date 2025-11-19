-- =======================================================
-- PHASE 2: GSC DATABASE SCHEMA COMPLETO
-- =======================================================
-- Tabelas: gsc_discovered_urls, gsc_search_analytics, 
--          gsc_indexing_jobs, gsc_indexing_alerts
-- =======================================================

-- 1. TABELA: gsc_discovered_urls
-- Armazena URLs descobertas via Search Analytics API
CREATE TABLE gsc_discovered_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(5,2) DEFAULT 0,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  current_status TEXT DEFAULT 'discovered' CHECK (current_status IN ('discovered', 'queued', 'indexed', 'failed')),
  gsc_data BOOLEAN DEFAULT FALSE,
  indexnow_data BOOLEAN DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, url)
);

CREATE INDEX idx_gsc_discovered_urls_site ON gsc_discovered_urls(site_id);
CREATE INDEX idx_gsc_discovered_urls_status ON gsc_discovered_urls(current_status);
CREATE INDEX idx_gsc_discovered_urls_integration ON gsc_discovered_urls(integration_id);

-- RLS para gsc_discovered_urls
ALTER TABLE gsc_discovered_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own discovered URLs"
ON gsc_discovered_urls FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_discovered_urls.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can manage own discovered URLs"
ON gsc_discovered_urls FOR ALL
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_discovered_urls.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all discovered URLs"
ON gsc_discovered_urls FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger updated_at para gsc_discovered_urls
CREATE TRIGGER update_gsc_discovered_urls_updated_at
  BEFORE UPDATE ON gsc_discovered_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================================================

-- 2. TABELA: gsc_search_analytics
-- Armazena dados históricos do Search Analytics API
CREATE TABLE gsc_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  page TEXT NOT NULL,
  query TEXT,
  date DATE NOT NULL,
  device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet')),
  country TEXT,
  clicks BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, page, query, date, device, country)
);

CREATE INDEX idx_gsc_search_analytics_site ON gsc_search_analytics(site_id);
CREATE INDEX idx_gsc_search_analytics_date ON gsc_search_analytics(date);
CREATE INDEX idx_gsc_search_analytics_page ON gsc_search_analytics(page);

-- RLS para gsc_search_analytics
ALTER TABLE gsc_search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own search analytics"
ON gsc_search_analytics FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_search_analytics.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can manage own search analytics"
ON gsc_search_analytics FOR ALL
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_search_analytics.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all search analytics"
ON gsc_search_analytics FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger updated_at para gsc_search_analytics
CREATE TRIGGER update_gsc_search_analytics_updated_at
  BEFORE UPDATE ON gsc_search_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================================================

-- 3. TRIGGER: Auto-marcar URLs como indexadas
-- Quando dados de Search Analytics são inseridos, marca URL como 'indexed'
CREATE OR REPLACE FUNCTION mark_url_as_indexed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gsc_discovered_urls
  SET 
    current_status = 'indexed',
    gsc_data = TRUE,
    last_checked_at = NOW(),
    updated_at = NOW()
  WHERE site_id = NEW.site_id 
    AND url = NEW.page;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_mark_url_indexed
  AFTER INSERT ON gsc_search_analytics
  FOR EACH ROW
  EXECUTE FUNCTION mark_url_as_indexed();

-- =======================================================

-- 4. TABELA: gsc_indexing_jobs
-- Armazena histórico de jobs de indexação
CREATE TABLE gsc_indexing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES google_search_console_integrations(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('discovery', 'sitemap', 'instant', 'queue_process')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  urls_processed INT DEFAULT 0,
  urls_successful INT DEFAULT 0,
  urls_failed INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gsc_indexing_jobs_site ON gsc_indexing_jobs(site_id);
CREATE INDEX idx_gsc_indexing_jobs_status ON gsc_indexing_jobs(status);
CREATE INDEX idx_gsc_indexing_jobs_type ON gsc_indexing_jobs(job_type);

-- RLS para gsc_indexing_jobs
ALTER TABLE gsc_indexing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own indexing jobs"
ON gsc_indexing_jobs FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_jobs.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can manage own indexing jobs"
ON gsc_indexing_jobs FOR ALL
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_jobs.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all indexing jobs"
ON gsc_indexing_jobs FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger updated_at para gsc_indexing_jobs
CREATE TRIGGER update_gsc_indexing_jobs_updated_at
  BEFORE UPDATE ON gsc_indexing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================================================

-- 5. TABELA: gsc_indexing_alerts
-- Armazena alertas proativos do sistema
CREATE TABLE gsc_indexing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES google_search_console_integrations(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('quota_exceeded', 'auth_failed', 'rate_limit', 'api_error', 'health_degraded')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gsc_indexing_alerts_site ON gsc_indexing_alerts(site_id);
CREATE INDEX idx_gsc_indexing_alerts_severity ON gsc_indexing_alerts(severity);
CREATE INDEX idx_gsc_indexing_alerts_resolved ON gsc_indexing_alerts(resolved_at);

-- RLS para gsc_indexing_alerts
ALTER TABLE gsc_indexing_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own alerts"
ON gsc_indexing_alerts FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_alerts.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can manage own alerts"
ON gsc_indexing_alerts FOR ALL
USING (
  has_role(auth.uid(), 'client'::app_role) AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_alerts.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all alerts"
ON gsc_indexing_alerts FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger updated_at para gsc_indexing_alerts
CREATE TRIGGER update_gsc_indexing_alerts_updated_at
  BEFORE UPDATE ON gsc_indexing_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================================================
-- PHASE 2 COMPLETA
-- =======================================================