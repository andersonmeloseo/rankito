-- Adicionar índices para otimização de queries de analytics na tabela rank_rent_conversions

-- Índice composto para queries por site e período (mais comum)
CREATE INDEX IF NOT EXISTS idx_conversions_site_created 
ON rank_rent_conversions (site_id, created_at DESC);

-- Índice para contagem de visitantes únicos por site
CREATE INDEX IF NOT EXISTS idx_conversions_site_ip 
ON rank_rent_conversions (site_id, ip_address);

-- Índice para contagem de páginas únicas por site
CREATE INDEX IF NOT EXISTS idx_conversions_site_page_path 
ON rank_rent_conversions (site_id, page_path);

-- Índice composto para queries filtradas por tipo de evento
CREATE INDEX IF NOT EXISTS idx_conversions_site_event_created 
ON rank_rent_conversions (site_id, event_type, created_at DESC);

-- Índice para queries filtradas por page_id
CREATE INDEX IF NOT EXISTS idx_conversions_page_created 
ON rank_rent_conversions (page_id, created_at DESC) 
WHERE page_id IS NOT NULL;

-- Índice GIN para queries no campo metadata (JSONB)
CREATE INDEX IF NOT EXISTS idx_conversions_metadata_gin 
ON rank_rent_conversions USING GIN (metadata);

-- Comentários explicativos
COMMENT ON INDEX idx_conversions_site_created IS 'Otimiza queries de analytics por site e período';
COMMENT ON INDEX idx_conversions_site_ip IS 'Otimiza contagem de visitantes únicos por site';
COMMENT ON INDEX idx_conversions_site_page_path IS 'Otimiza contagem de páginas únicas por site';
COMMENT ON INDEX idx_conversions_site_event_created IS 'Otimiza queries filtradas por tipo de evento';
COMMENT ON INDEX idx_conversions_page_created IS 'Otimiza queries de analytics por página específica';
COMMENT ON INDEX idx_conversions_metadata_gin IS 'Otimiza queries em campos JSON como device';