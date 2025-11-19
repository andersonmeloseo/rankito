-- ============================================================
-- Phase 7.1: Correção de integration_id em gsc_discovered_urls
-- Torna integration_id NULLABLE e remove constraint inadequada
-- ============================================================

-- 1. Remove constraint que exige integration_id
ALTER TABLE gsc_discovered_urls 
  DROP CONSTRAINT IF EXISTS unique_gsc_discovered_urls_composite;

-- 2. Torna integration_id opcional (permite NULL)
ALTER TABLE gsc_discovered_urls 
  ALTER COLUMN integration_id DROP NOT NULL;

-- 3. Comentário explicativo
COMMENT ON COLUMN gsc_discovered_urls.integration_id IS 
  'ID da integração GSC que descobriu esta URL. NULL = descoberta via sitemap ou método genérico';

-- 4. Remove constraint órfã com 'country' que não é usada
ALTER TABLE gsc_search_analytics 
  DROP CONSTRAINT IF EXISTS gsc_search_analytics_site_id_page_query_date_device_country_key;

-- Resultado final:
-- gsc_search_analytics: UNIQUE (site_id, page, query, date, device) ✓
-- gsc_discovered_urls: UNIQUE (site_id, url) ✓ + integration_id NULLABLE ✓