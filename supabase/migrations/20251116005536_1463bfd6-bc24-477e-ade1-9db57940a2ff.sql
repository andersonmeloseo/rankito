-- Adicionar índices críticos para otimização de performance do sistema GSC

-- Índice 1: Otimizar verificação de quota diária (usado frequentemente em gsc-get-aggregated-quota)
CREATE INDEX IF NOT EXISTS idx_gsc_requests_quota 
ON gsc_url_indexing_requests(integration_id, submitted_at DESC)
WHERE status = 'completed';

-- Índice 2: Otimizar verificação de duplicatas de 24h (usado em gsc-request-indexing)
CREATE INDEX IF NOT EXISTS idx_gsc_requests_url_date 
ON gsc_url_indexing_requests(url, submitted_at DESC);

-- Índice 3: Otimizar busca de URLs pendentes para processamento (usado em gsc-process-indexing-queue)
CREATE INDEX IF NOT EXISTS idx_gsc_queue_scheduled 
ON gsc_indexing_queue(scheduled_for, status)
WHERE status = 'pending';

-- Índice 4: Otimizar join de integrações por site (usado em múltiplas queries)
CREATE INDEX IF NOT EXISTS idx_gsc_integrations_site 
ON google_search_console_integrations(site_id, health_status, is_active)
WHERE is_active = true;