-- Adicionar coluna used_integration_id para rastrear qual integração indexou cada URL
ALTER TABLE gsc_url_indexing_requests 
ADD COLUMN IF NOT EXISTS used_integration_id UUID REFERENCES google_search_console_integrations(id);

-- Criar índice para melhorar performance de queries de distribuição
CREATE INDEX IF NOT EXISTS idx_gsc_url_indexing_requests_used_integration 
ON gsc_url_indexing_requests(used_integration_id, created_at DESC);

-- Criar tabela para logs de uso de integração (para métricas de distribuição)
CREATE TABLE IF NOT EXISTS gsc_integration_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  urls_indexed INTEGER NOT NULL DEFAULT 0,
  urls_failed INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER,
  quota_used_percent NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(integration_id, date)
);

-- Índice para queries de histórico
CREATE INDEX IF NOT EXISTS idx_gsc_integration_usage_logs_date 
ON gsc_integration_usage_logs(integration_id, date DESC);

-- RLS para gsc_integration_usage_logs
ALTER TABLE gsc_integration_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their integrations"
ON gsc_integration_usage_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM google_search_console_integrations
    WHERE google_search_console_integrations.id = gsc_integration_usage_logs.integration_id
    AND google_search_console_integrations.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert usage logs"
ON gsc_integration_usage_logs FOR INSERT
WITH CHECK (true);