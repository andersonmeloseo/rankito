-- Tabela de integrações com Google Search Console
CREATE TABLE google_search_console_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  
  -- Credenciais OAuth2
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Informações da propriedade do Search Console
  gsc_property_url TEXT NOT NULL,
  gsc_permission_level TEXT,
  
  -- Configurações
  auto_submit_sitemaps BOOLEAN DEFAULT false,
  auto_submit_new_pages BOOLEAN DEFAULT false,
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, site_id)
);

-- Tabela de submissões de sitemaps ao GSC
CREATE TABLE gsc_sitemap_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  
  sitemap_url TEXT NOT NULL,
  sitemap_type TEXT,
  
  -- Status no GSC
  gsc_status TEXT,
  gsc_last_submitted TIMESTAMPTZ,
  gsc_last_downloaded TIMESTAMPTZ,
  gsc_errors_count INTEGER DEFAULT 0,
  gsc_warnings_count INTEGER DEFAULT 0,
  
  -- URLs processadas
  urls_submitted INTEGER DEFAULT 0,
  urls_indexed INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(integration_id, sitemap_url)
);

-- Tabela de requisições de indexação de URLs
CREATE TABLE gsc_url_indexing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  page_id UUID REFERENCES rank_rent_pages(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'URL_UPDATED',
  
  -- Status da requisição
  status TEXT DEFAULT 'pending',
  
  -- Resposta da API
  gsc_notification_id TEXT,
  gsc_response JSONB,
  error_message TEXT,
  
  -- Controle de quota (Google permite 200 requisições/dia)
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para queries rápidas
CREATE INDEX idx_gsc_integrations_user_site ON google_search_console_integrations(user_id, site_id);
CREATE INDEX idx_gsc_integrations_active ON google_search_console_integrations(is_active);

CREATE INDEX idx_gsc_sitemap_submissions_integration ON gsc_sitemap_submissions(integration_id);
CREATE INDEX idx_gsc_sitemap_submissions_site ON gsc_sitemap_submissions(site_id);

CREATE INDEX idx_gsc_url_requests_integration ON gsc_url_indexing_requests(integration_id);
CREATE INDEX idx_gsc_url_requests_status ON gsc_url_indexing_requests(status);
CREATE INDEX idx_gsc_url_requests_date ON gsc_url_indexing_requests(submitted_at);
CREATE INDEX idx_gsc_url_requests_page ON gsc_url_indexing_requests(page_id);

-- RLS Policies para google_search_console_integrations
ALTER TABLE google_search_console_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GSC integrations"
  ON google_search_console_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GSC integrations"
  ON google_search_console_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GSC integrations"
  ON google_search_console_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GSC integrations"
  ON google_search_console_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para gsc_sitemap_submissions
ALTER TABLE gsc_sitemap_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sitemap submissions"
  ON gsc_sitemap_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE id = gsc_sitemap_submissions.integration_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sitemap submissions"
  ON gsc_sitemap_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE id = gsc_sitemap_submissions.integration_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sitemap submissions"
  ON gsc_sitemap_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE id = gsc_sitemap_submissions.integration_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sitemap submissions"
  ON gsc_sitemap_submissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE id = gsc_sitemap_submissions.integration_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies para gsc_url_indexing_requests
ALTER TABLE gsc_url_indexing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own indexing requests"
  ON gsc_url_indexing_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE id = gsc_url_indexing_requests.integration_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own indexing requests"
  ON gsc_url_indexing_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE id = gsc_url_indexing_requests.integration_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Edge functions can insert indexing requests"
  ON gsc_url_indexing_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Edge functions can update indexing requests"
  ON gsc_url_indexing_requests
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gsc_integrations_updated_at
  BEFORE UPDATE ON google_search_console_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gsc_sitemap_submissions_updated_at
  BEFORE UPDATE ON gsc_sitemap_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();