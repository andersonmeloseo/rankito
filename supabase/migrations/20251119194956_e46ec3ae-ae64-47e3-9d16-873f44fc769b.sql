-- ============================================================
-- Migration: Adicionar UNIQUE constraints para GSC tables
-- Correção crítica: permite upserts funcionarem corretamente
-- ============================================================

-- 1. UNIQUE constraint para gsc_search_analytics
-- Previne duplicatas de métricas para mesma combinação
ALTER TABLE gsc_search_analytics 
  ADD CONSTRAINT unique_gsc_search_analytics_composite 
  UNIQUE (site_id, page, query, date, device);

-- 2. UNIQUE constraint para gsc_discovered_urls
-- Previne duplicatas de URLs descobertas por integração
ALTER TABLE gsc_discovered_urls 
  ADD CONSTRAINT unique_gsc_discovered_urls_composite 
  UNIQUE (site_id, integration_id, url);

-- Comentários explicativos
COMMENT ON CONSTRAINT unique_gsc_search_analytics_composite ON gsc_search_analytics IS 
  'Garante unicidade de métricas GSC por combinação de site, página, query, data e device';

COMMENT ON CONSTRAINT unique_gsc_discovered_urls_composite ON gsc_discovered_urls IS 
  'Garante unicidade de URLs descobertas por site e integração GSC';