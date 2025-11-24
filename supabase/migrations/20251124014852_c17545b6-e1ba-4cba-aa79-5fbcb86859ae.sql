-- ============================================================================
-- NORMALIZAÇÃO DE URLs - Limpeza Completa de Duplicatas
-- ============================================================================

-- Criar função de normalização PRIMEIRO (sem o índice ainda)
CREATE OR REPLACE FUNCTION normalize_page_url(url TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := url;
  
  -- Remover query params comuns de preview/admin
  normalized := REGEXP_REPLACE(normalized, '\?.*elementor.*', '');
  normalized := REGEXP_REPLACE(normalized, '\?.*preview.*', '');
  normalized := REGEXP_REPLACE(normalized, '\?.*page_id.*', '');
  
  -- Remover todos os query params se ainda existirem
  normalized := REGEXP_REPLACE(normalized, '\?.*$', '');
  
  -- Remover fragmentos (#)
  normalized := REGEXP_REPLACE(normalized, '#.*$', '');
  
  -- Remover trailing slash (exceto raiz)
  IF normalized !~ '://[^/]+/?$' AND normalized ~ '/$' THEN
    normalized := REGEXP_REPLACE(normalized, '/$', '');
  END IF;
  
  -- Lowercase
  normalized := LOWER(normalized);
  
  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Agora deletar TODAS as duplicatas usando a função
DO $$
DECLARE
  deleted_count INT;
  total_deleted INT := 0;
BEGIN
  RAISE NOTICE '🧹 Iniciando limpeza de URLs duplicadas...';
  
  -- Deletar URLs de preview/admin do WordPress/Elementor
  DELETE FROM rank_rent_pages
  WHERE 
    page_url LIKE '%elementor-preview%'
    OR page_url LIKE '%elementor_library%'
    OR page_url LIKE '%elementor-action%'
    OR page_url LIKE '%preview_id=%'
    OR page_url LIKE '%preview_nonce=%'
    OR (page_url LIKE '%page_id=%' AND page_url LIKE '%preview%');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✅ Deleted % preview/admin URLs', deleted_count;
  
  -- Deletar TODAS as variações mantendo apenas a mais antiga por URL normalizada
  WITH normalized_groups AS (
    SELECT 
      site_id,
      normalize_page_url(page_url) AS normalized_url,
      ARRAY_AGG(id ORDER BY created_at ASC) AS ids
    FROM rank_rent_pages
    GROUP BY site_id, normalize_page_url(page_url)
    HAVING COUNT(*) > 1
  )
  DELETE FROM rank_rent_pages
  WHERE id IN (
    SELECT UNNEST(ids[2:]) FROM normalized_groups
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  RAISE NOTICE '  ✅ Deleted % duplicate variations', deleted_count;
  
  RAISE NOTICE '🎯 Total URLs deleted: %', total_deleted;
END $$;

-- Agora criar o índice único (não vai falhar porque limpamos tudo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rank_rent_pages_normalized_url 
ON rank_rent_pages (site_id, normalize_page_url(page_url));

-- Log final
DO $$
DECLARE
  total_pages INT;
  sites_affected INT;
BEGIN
  SELECT COUNT(*) INTO total_pages FROM rank_rent_pages;
  SELECT COUNT(DISTINCT site_id) INTO sites_affected FROM rank_rent_pages;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ URL Normalization Complete!';
  RAISE NOTICE '📊 Total pages remaining: %', total_pages;
  RAISE NOTICE '🏢 Sites affected: %', sites_affected;
  RAISE NOTICE '🛡️ Unique constraint created successfully';
  RAISE NOTICE '========================================';
END $$;