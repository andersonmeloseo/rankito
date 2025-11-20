-- ================================================
-- SISTEMA DE AGENDAMENTO INTELIGENTE GSC
-- ================================================

-- Tabela principal de agendamentos
CREATE TABLE IF NOT EXISTS gsc_scheduled_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES google_search_console_integrations(id) ON DELETE SET NULL,
  
  -- Tipo e agendamento
  submission_type TEXT NOT NULL CHECK (submission_type IN ('sitemap', 'urls', 'auto_distribution')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  priority INTEGER DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  
  -- Dados da submissão
  sitemap_url TEXT,
  urls TEXT[],
  
  -- Status e execução
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Resultados
  urls_submitted INTEGER DEFAULT 0,
  urls_successful INTEGER DEFAULT 0,
  urls_failed INTEGER DEFAULT 0,
  error_message TEXT,
  response_data JSONB,
  
  -- Metadata
  created_by_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_site ON gsc_scheduled_submissions(site_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_status ON gsc_scheduled_submissions(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_integration ON gsc_scheduled_submissions(integration_id);

-- Modificar gsc_discovered_urls para suportar agendamento
ALTER TABLE gsc_discovered_urls
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS auto_schedule_enabled BOOLEAN DEFAULT TRUE;

-- Adicionar constraint de priority se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gsc_discovered_urls_priority_check'
  ) THEN
    ALTER TABLE gsc_discovered_urls 
    ADD CONSTRAINT gsc_discovered_urls_priority_check 
    CHECK (priority >= 0 AND priority <= 100);
  END IF;
END $$;

-- Índice para URLs agendadas
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_scheduled 
ON gsc_discovered_urls(scheduled_for, current_status, site_id)
WHERE current_status = 'discovered' AND auto_schedule_enabled = TRUE;

-- Tabela de logs de execução
CREATE TABLE IF NOT EXISTS gsc_schedule_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_type TEXT NOT NULL CHECK (execution_type IN ('scheduler', 'processor')),
  sites_processed INTEGER DEFAULT 0,
  urls_scheduled INTEGER DEFAULT 0,
  urls_processed INTEGER DEFAULT 0,
  integrations_used INTEGER DEFAULT 0,
  total_capacity INTEGER DEFAULT 0,
  execution_duration_ms INTEGER,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_logs_date ON gsc_schedule_execution_logs(created_at DESC);

-- RLS Policies para gsc_scheduled_submissions
ALTER TABLE gsc_scheduled_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own scheduled submissions" ON gsc_scheduled_submissions;
CREATE POLICY "Users can view own scheduled submissions"
  ON gsc_scheduled_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE id = gsc_scheduled_submissions.site_id
      AND owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own scheduled submissions" ON gsc_scheduled_submissions;
CREATE POLICY "Users can insert own scheduled submissions"
  ON gsc_scheduled_submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE id = gsc_scheduled_submissions.site_id
      AND owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own scheduled submissions" ON gsc_scheduled_submissions;
CREATE POLICY "Users can update own scheduled submissions"
  ON gsc_scheduled_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE id = gsc_scheduled_submissions.site_id
      AND owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own scheduled submissions" ON gsc_scheduled_submissions;
CREATE POLICY "Users can delete own scheduled submissions"
  ON gsc_scheduled_submissions FOR DELETE
  USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE id = gsc_scheduled_submissions.site_id
      AND owner_user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_scheduled_submissions_updated_at ON gsc_scheduled_submissions;
CREATE TRIGGER update_scheduled_submissions_updated_at
  BEFORE UPDATE ON gsc_scheduled_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();