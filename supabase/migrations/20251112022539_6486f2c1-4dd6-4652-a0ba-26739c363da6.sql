-- Corrigir constraint UNIQUE da tabela rank_rent_pages
-- Problema: constraint permite apenas uma URL globalmente, mas deveria permitir mesma URL em sites diferentes

-- Remover constraint UNIQUE antiga (apenas page_url)
ALTER TABLE rank_rent_pages DROP CONSTRAINT IF EXISTS rank_rent_pages_page_url_key;

-- Criar constraint UNIQUE composta (site_id + page_url)
-- Permite mesma URL em sites diferentes, mas garante unicidade dentro de cada site
ALTER TABLE rank_rent_pages ADD CONSTRAINT rank_rent_pages_site_page_url_key 
  UNIQUE (site_id, page_url);

-- Recrear índice otimizado para queries por site+url
DROP INDEX IF EXISTS idx_pages_url;
CREATE INDEX idx_pages_site_url ON rank_rent_pages(site_id, page_url);