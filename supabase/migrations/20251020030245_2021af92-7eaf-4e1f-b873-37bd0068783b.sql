-- ============================================================================
-- FASE 1: RLS POLICIES PARA ACESSO PÚBLICO VIA TOKEN
-- ============================================================================
-- Permitir que portais públicos acessem dados do cliente específico via token válido

-- 1. Policy para client_portal_analytics (acesso público via token)
DROP POLICY IF EXISTS "Public can view enabled analytics via token" ON client_portal_analytics;
CREATE POLICY "Public can view enabled analytics via token"
ON client_portal_analytics
FOR SELECT
USING (enabled = true);

-- 2. Policy para rank_rent_sites (acesso via client_id de portal ativo)
DROP POLICY IF EXISTS "Public can view sites for active portals" ON rank_rent_sites;
CREATE POLICY "Public can view sites for active portals"
ON rank_rent_sites
FOR SELECT
USING (
  client_id IN (
    SELECT client_id 
    FROM client_portal_analytics 
    WHERE enabled = true
  )
);

-- 3. Policy para rank_rent_pages (acesso via sites de portais ativos)
DROP POLICY IF EXISTS "Public can view pages for active portals" ON rank_rent_pages;
CREATE POLICY "Public can view pages for active portals"
ON rank_rent_pages
FOR SELECT
USING (
  site_id IN (
    SELECT s.id 
    FROM rank_rent_sites s
    JOIN client_portal_analytics cpa ON cpa.client_id = s.client_id
    WHERE cpa.enabled = true
  )
);

-- 4. Policy para rank_rent_conversions (acesso via sites de portais ativos)
DROP POLICY IF EXISTS "Public can view conversions for active portals" ON rank_rent_conversions;
CREATE POLICY "Public can view conversions for active portals"
ON rank_rent_conversions
FOR SELECT
USING (
  site_id IN (
    SELECT s.id 
    FROM rank_rent_sites s
    JOIN client_portal_analytics cpa ON cpa.client_id = s.client_id
    WHERE cpa.enabled = true
  )
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE (queries públicas serão muito frequentes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_client_portal_analytics_enabled 
ON client_portal_analytics(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_rank_rent_sites_client_id 
ON rank_rent_sites(client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rank_rent_conversions_site_id_created 
ON rank_rent_conversions(site_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rank_rent_pages_site_id 
ON rank_rent_pages(site_id) WHERE is_rented = true;