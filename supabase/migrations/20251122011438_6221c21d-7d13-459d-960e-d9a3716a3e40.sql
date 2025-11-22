-- Melhoria 1: Sistema de Validação de URLs
-- Adiciona colunas para validação de URLs antes de indexação

ALTER TABLE gsc_discovered_urls
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid_domain', 'unreachable', 'duplicate')),
ADD COLUMN IF NOT EXISTS validation_error TEXT,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- Índice para queries de URLs válidas
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_validation_status ON gsc_discovered_urls(validation_status);

-- Comentários
COMMENT ON COLUMN gsc_discovered_urls.validation_status IS 'Status de validação: pending (não validada), valid (pronta para indexar), invalid_domain (domínio não corresponde), unreachable (URL inacessível), duplicate (já existe)';
COMMENT ON COLUMN gsc_discovered_urls.validation_error IS 'Mensagem de erro da validação se status != valid';
COMMENT ON COLUMN gsc_discovered_urls.validated_at IS 'Timestamp da última validação';

-- Melhoria 2: Sistema de Retry Inteligente
-- Adiciona controle de tentativas e agendamento de retries

ALTER TABLE gsc_discovered_urls
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retry_reason TEXT CHECK (retry_reason IN ('quota_exceeded', 'rate_limit', 'auth_error', 'temporary_error', 'network_error', NULL));

-- Índice para queries de retry agendado
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_next_retry ON gsc_discovered_urls(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Comentários
COMMENT ON COLUMN gsc_discovered_urls.retry_count IS 'Número de tentativas de indexação (máximo 3)';
COMMENT ON COLUMN gsc_discovered_urls.last_retry_at IS 'Timestamp da última tentativa de retry';
COMMENT ON COLUMN gsc_discovered_urls.next_retry_at IS 'Timestamp agendado para próximo retry (exponential backoff: 1h, 6h, 24h)';
COMMENT ON COLUMN gsc_discovered_urls.retry_reason IS 'Motivo do retry: quota_exceeded, rate_limit, auth_error, temporary_error, network_error';

-- Melhoria 3: Distribuição Inteligente Entre Integrações
-- Adiciona métricas de performance para load balancing

ALTER TABLE google_search_console_integrations
ADD COLUMN IF NOT EXISTS success_rate NUMERIC(5,2) DEFAULT 100.00 CHECK (success_rate >= 0 AND success_rate <= 100),
ADD COLUMN IF NOT EXISTS avg_response_time_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_performance_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentários
COMMENT ON COLUMN google_search_console_integrations.success_rate IS 'Taxa de sucesso de indexação (%) calculada sobre últimas 100 requisições';
COMMENT ON COLUMN google_search_console_integrations.avg_response_time_ms IS 'Tempo médio de resposta em milissegundos (últimas 50 requisições)';
COMMENT ON COLUMN google_search_console_integrations.last_performance_update IS 'Última vez que métricas de performance foram atualizadas';

-- Melhoria 4: Status Real do Google via Inspection API
-- Adiciona colunas para armazenar status real retornado pelo Google

ALTER TABLE gsc_discovered_urls
ADD COLUMN IF NOT EXISTS google_inspection_status TEXT CHECK (google_inspection_status IN ('URL_IS_UNKNOWN', 'DISCOVERY_PENDING', 'DISCOVERED_NOT_INDEXED', 'CRAWLED_NOT_INDEXED', 'INDEXED', 'ERROR', NULL)),
ADD COLUMN IF NOT EXISTS google_last_inspected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS google_inspection_data JSONB;

-- Índice para queries de status de inspeção
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_inspection_status ON gsc_discovered_urls(google_inspection_status);
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_last_inspected ON gsc_discovered_urls(google_last_inspected_at) WHERE google_last_inspected_at IS NOT NULL;

-- Comentários
COMMENT ON COLUMN gsc_discovered_urls.google_inspection_status IS 'Status real retornado pela Google Search Console Inspection API';
COMMENT ON COLUMN gsc_discovered_urls.google_last_inspected_at IS 'Última vez que consultamos status real no Google';
COMMENT ON COLUMN gsc_discovered_urls.google_inspection_data IS 'JSON completo da resposta da Inspection API (mobile/desktop usability, AMP status, etc)';

-- Função para calcular success_rate de integração (triggered após cada request)
CREATE OR REPLACE FUNCTION update_integration_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar success_rate e avg_response_time_ms com base nas últimas requisições
  UPDATE google_search_console_integrations
  SET
    success_rate = (
      SELECT ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / GREATEST(COUNT(*), 1)) * 100, 2)
      FROM (
        SELECT status FROM gsc_url_indexing_requests
        WHERE integration_id = NEW.integration_id
        ORDER BY created_at DESC
        LIMIT 100
      ) recent_requests
    ),
    avg_response_time_ms = (
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000)::INTEGER, 0)
      FROM (
        SELECT created_at, updated_at FROM gsc_url_indexing_requests
        WHERE integration_id = NEW.integration_id
          AND status = 'success'
        ORDER BY created_at DESC
        LIMIT 50
      ) recent_success
    ),
    last_performance_update = NOW()
  WHERE id = NEW.integration_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar performance após cada requisição
DROP TRIGGER IF EXISTS trigger_update_integration_performance ON gsc_url_indexing_requests;
CREATE TRIGGER trigger_update_integration_performance
AFTER INSERT ON gsc_url_indexing_requests
FOR EACH ROW
EXECUTE FUNCTION update_integration_performance();