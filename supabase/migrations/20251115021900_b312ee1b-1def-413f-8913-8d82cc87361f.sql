-- Criar índices para otimizar performance da view pages_with_indexnow_status

-- Índice GIN para busca rápida em JSONB (campo urlList no request_payload)
CREATE INDEX IF NOT EXISTS idx_indexnow_submissions_payload_urllist 
ON indexnow_submissions USING gin ((request_payload->'urlList'));

-- Índice composto para acelerar filtros por site_id + status
CREATE INDEX IF NOT EXISTS idx_indexnow_submissions_site_status 
ON indexnow_submissions (site_id, status);

-- Índice para ordenação por data de submissão
CREATE INDEX IF NOT EXISTS idx_indexnow_submissions_created_at 
ON indexnow_submissions (created_at DESC);