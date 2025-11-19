-- ============================================================================
-- FASE 4: MIGRAÇÃO DE DADOS (CORRIGIDA - COM DEDUPLICAÇÃO)
-- Data: 2025-01-19
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASSO 1: Adicionar flag de migração nas tabelas antigas
-- ----------------------------------------------------------------------------

ALTER TABLE gsc_indexing_queue 
ADD COLUMN IF NOT EXISTS migrated_to_new_system BOOLEAN DEFAULT FALSE;

ALTER TABLE gsc_url_indexing_requests 
ADD COLUMN IF NOT EXISTS migrated_to_new_system BOOLEAN DEFAULT FALSE;

-- ----------------------------------------------------------------------------
-- PASSO 2: Migrar URLs da fila antiga para gsc_discovered_urls (COM DEDUPLICAÇÃO)
-- ----------------------------------------------------------------------------

INSERT INTO gsc_discovered_urls (
  site_id,
  page_id,
  url,
  current_status,
  sitemap_found,
  created_at,
  updated_at
)
SELECT DISTINCT ON (gsi.site_id, giq.url)
  gsi.site_id,
  giq.page_id,
  giq.url,
  CASE 
    WHEN giq.status = 'completed' THEN 'sent_for_indexing'
    WHEN giq.status = 'failed' THEN 'failed'
    ELSE 'unknown'
  END as current_status,
  FALSE as sitemap_found,
  giq.created_at,
  COALESCE(giq.processed_at, giq.created_at) as updated_at
FROM gsc_indexing_queue giq
JOIN google_search_console_integrations gsi ON gsi.id = giq.integration_id
WHERE giq.url IS NOT NULL
ORDER BY gsi.site_id, giq.url, giq.created_at DESC
ON CONFLICT (site_id, url) DO UPDATE SET
  current_status = CASE 
    WHEN EXCLUDED.current_status = 'sent_for_indexing' 
      AND gsc_discovered_urls.current_status = 'unknown' 
    THEN EXCLUDED.current_status
    ELSE gsc_discovered_urls.current_status
  END,
  updated_at = GREATEST(gsc_discovered_urls.updated_at, EXCLUDED.updated_at);

-- ----------------------------------------------------------------------------
-- PASSO 3: Migrar histórico de requests para gsc_indexing_jobs
-- ----------------------------------------------------------------------------

INSERT INTO gsc_indexing_jobs (
  site_id,
  integration_id,
  job_type,
  status,
  urls_processed,
  urls_successful,
  urls_failed,
  started_at,
  completed_at,
  created_at
)
SELECT 
  gsi.site_id,
  guir.integration_id,
  'manual' as job_type,
  CASE 
    WHEN COUNT(*) FILTER (WHERE guir.status = 'failed') = COUNT(*) THEN 'failed'
    WHEN COUNT(*) FILTER (WHERE guir.status = 'success') > 0 THEN 'completed'
    ELSE 'queued'
  END as status,
  COUNT(*) as urls_processed,
  COUNT(*) FILTER (WHERE guir.status = 'success') as urls_successful,
  COUNT(*) FILTER (WHERE guir.status = 'failed') as urls_failed,
  MIN(guir.submitted_at) as started_at,
  MAX(guir.completed_at) as completed_at,
  MIN(guir.created_at) as created_at
FROM gsc_url_indexing_requests guir
JOIN google_search_console_integrations gsi ON gsi.id = guir.integration_id
WHERE guir.submitted_at IS NOT NULL
GROUP BY gsi.site_id, guir.integration_id, DATE(guir.submitted_at)
ORDER BY MIN(guir.submitted_at) DESC;

-- ----------------------------------------------------------------------------
-- PASSO 4: Marcar registros como migrados
-- ----------------------------------------------------------------------------

UPDATE gsc_indexing_queue 
SET migrated_to_new_system = TRUE 
WHERE url IS NOT NULL;

UPDATE gsc_url_indexing_requests 
SET migrated_to_new_system = TRUE 
WHERE submitted_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PASSO 5: Adicionar comentários de deprecation
-- ----------------------------------------------------------------------------

COMMENT ON TABLE gsc_indexing_queue IS 
'[DEPRECATED] Migrado para gsc_discovered_urls em 2025-01-19. Será deletado em 2025-02-19.';

COMMENT ON TABLE gsc_url_indexing_requests IS 
'[DEPRECATED] Migrado para gsc_indexing_jobs em 2025-01-19. Será deletado em 2025-02-19.';

COMMENT ON TABLE gsc_integration_usage_logs IS 
'[DEPRECATED] Sistema antigo de logs. Nova arquitetura usa gsc_indexing_jobs. Será deletado em 2025-02-19.';