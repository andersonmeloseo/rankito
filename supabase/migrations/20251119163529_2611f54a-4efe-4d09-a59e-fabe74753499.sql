-- ============================================================================
-- FASE 1: CRIAÇÃO DAS NOVAS TABELAS DO SISTEMA GSC REFATORADO
-- Data: 2025-01-19
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 1: gsc_discovered_urls
-- Centraliza todas as URLs descobertas (via GSC API, sitemaps, etc)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gsc_discovered_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES rank_rent_pages(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  
  -- Flags de origem da descoberta
  gsc_data BOOLEAN DEFAULT FALSE, -- Descoberta via GSC Search Analytics API
  sitemap_found BOOLEAN DEFAULT FALSE, -- Encontrada em sitemap
  sitemap_url TEXT, -- URL do sitemap onde foi encontrada
  sitemap_id UUID REFERENCES gsc_sitemap_submissions(id) ON DELETE SET NULL,
  
  -- Metadados do sitemap (se aplicável)
  lastmod TIMESTAMP WITH TIME ZONE,
  priority NUMERIC(2,1),
  
  -- Status de indexação
  current_status TEXT DEFAULT 'unknown' CHECK (current_status IN (
    'indexed', 
    'sent_for_indexing', 
    'failed', 
    'not_indexed', 
    'unknown'
  )),
  last_checked_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: URL única por site
  CONSTRAINT unique_site_url UNIQUE(site_id, url)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_site_id ON gsc_discovered_urls(site_id);
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_status ON gsc_discovered_urls(current_status);
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_gsc_data ON gsc_discovered_urls(gsc_data);
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_sitemap ON gsc_discovered_urls(sitemap_found);

-- RLS Policies
ALTER TABLE gsc_discovered_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view discovered URLs for their sites"
  ON gsc_discovered_urls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_discovered_urls.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  ));

CREATE POLICY "System can insert discovered URLs"
  ON gsc_discovered_urls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update discovered URLs"
  ON gsc_discovered_urls FOR UPDATE
  USING (true);

-- ----------------------------------------------------------------------------
-- TABELA 2: gsc_search_analytics
-- Dados brutos da GSC Search Analytics API (páginas + métricas)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gsc_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  
  -- Dados da página
  page_url TEXT NOT NULL,
  
  -- Métricas agregadas
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0, -- Click-through rate
  position NUMERIC(5,2) DEFAULT 0, -- Posição média
  
  -- Período dos dados
  date DATE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: dados únicos por site + página + data
  CONSTRAINT unique_analytics_entry UNIQUE(site_id, page_url, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gsc_search_analytics_site_id ON gsc_search_analytics(site_id);
CREATE INDEX IF NOT EXISTS idx_gsc_search_analytics_date ON gsc_search_analytics(date);
CREATE INDEX IF NOT EXISTS idx_gsc_search_analytics_integration ON gsc_search_analytics(integration_id);

-- RLS Policies
ALTER TABLE gsc_search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their sites"
  ON gsc_search_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_search_analytics.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  ));

CREATE POLICY "System can insert analytics"
  ON gsc_search_analytics FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- TRIGGER: Marcar URL como indexada quando aparecer no GSC Search Analytics
-- ----------------------------------------------------------------------------

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
    AND url = NEW.page_url;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_mark_url_indexed
  AFTER INSERT ON gsc_search_analytics
  FOR EACH ROW
  EXECUTE FUNCTION mark_url_as_indexed();

-- ----------------------------------------------------------------------------
-- TABELA 3: gsc_indexing_jobs
-- Histórico de jobs de descoberta/indexação (substitui queue + requests)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gsc_indexing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES google_search_console_integrations(id) ON DELETE SET NULL,
  
  -- Tipo de job
  job_type TEXT NOT NULL CHECK (job_type IN ('manual', 'scheduled', 'discovery')),
  
  -- Status do job
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 
    'running', 
    'completed', 
    'failed'
  )),
  
  -- Métricas do job
  urls_processed INTEGER DEFAULT 0,
  urls_successful INTEGER DEFAULT 0,
  urls_failed INTEGER DEFAULT 0,
  
  -- Dados adicionais
  results JSONB, -- Resultados detalhados
  error_details TEXT,
  error_type TEXT, -- indexnow_file_not_found, gsc_auth_failed, quota_exceeded
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_jobs_site_id ON gsc_indexing_jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_jobs_status ON gsc_indexing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_jobs_type ON gsc_indexing_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_jobs_created ON gsc_indexing_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE gsc_indexing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs for their sites"
  ON gsc_indexing_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_jobs.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  ));

CREATE POLICY "System can insert jobs"
  ON gsc_indexing_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update jobs"
  ON gsc_indexing_jobs FOR UPDATE
  USING (true);

-- ----------------------------------------------------------------------------
-- TABELA 4: gsc_indexing_alerts
-- Sistema de alertas proativo para problemas de integração
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gsc_indexing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES google_search_console_integrations(id) ON DELETE SET NULL,
  
  -- Tipo de alerta
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'repeated_failure',      -- Falhas consecutivas
    'never_executed',        -- Job nunca executou em 24h+
    'indexnow_missing',      -- Arquivo IndexNow não encontrado
    'low_success_rate',      -- Taxa de sucesso < 50%
    'config_issue'           -- Problema de autenticação/permissão
  )),
  
  -- Severidade
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Detalhes
  message TEXT NOT NULL,
  details JSONB,
  
  -- Status
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_alerts_site_id ON gsc_indexing_alerts(site_id);
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_alerts_resolved ON gsc_indexing_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_alerts_severity ON gsc_indexing_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_gsc_indexing_alerts_created ON gsc_indexing_alerts(created_at DESC);

-- RLS Policies
ALTER TABLE gsc_indexing_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their sites"
  ON gsc_indexing_alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_alerts.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  ));

CREATE POLICY "System can insert alerts"
  ON gsc_indexing_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update alerts for their sites"
  ON gsc_indexing_alerts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_indexing_alerts.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  ));