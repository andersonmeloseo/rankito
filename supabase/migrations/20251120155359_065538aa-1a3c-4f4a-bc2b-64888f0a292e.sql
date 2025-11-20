-- Adicionar campo sent_to_indexnow para tracking de URLs enviadas ao IndexNow
ALTER TABLE gsc_discovered_urls 
ADD COLUMN IF NOT EXISTS sent_to_indexnow BOOLEAN DEFAULT false;

-- Criar índice para otimizar queries filtradas por IndexNow
CREATE INDEX IF NOT EXISTS idx_gsc_discovered_urls_sent_to_indexnow 
ON gsc_discovered_urls(site_id, sent_to_indexnow);

-- Comentário explicativo
COMMENT ON COLUMN gsc_discovered_urls.sent_to_indexnow IS 'Indica se a URL foi enviada ao IndexNow para indexação';