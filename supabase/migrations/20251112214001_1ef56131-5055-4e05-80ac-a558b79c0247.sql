-- Adicionar colunas de status GSC na tabela de páginas
ALTER TABLE rank_rent_pages
ADD COLUMN IF NOT EXISTS gsc_indexation_status TEXT DEFAULT 'not_submitted',
ADD COLUMN IF NOT EXISTS gsc_last_crawled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gsc_indexed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gsc_last_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gsc_integration_used TEXT;

-- Criar view para quota agregada por site
CREATE OR REPLACE VIEW gsc_aggregated_quota_status AS
SELECT 
  s.id AS site_id,
  s.site_name,
  s.owner_user_id AS user_id,
  COUNT(DISTINCT gi.id) AS total_integrations,
  COUNT(DISTINCT gi.id) * 200 AS total_daily_limit,
  (
    SELECT COUNT(*)
    FROM gsc_url_indexing_requests ir
    WHERE ir.integration_id IN (
      SELECT id FROM google_search_console_integrations
      WHERE site_id = s.id AND is_active = true
    )
    AND DATE(ir.submitted_at) = CURRENT_DATE
  ) AS total_used_today,
  (COUNT(DISTINCT gi.id) * 200) - (
    SELECT COUNT(*)
    FROM gsc_url_indexing_requests ir
    WHERE ir.integration_id IN (
      SELECT id FROM google_search_console_integrations
      WHERE site_id = s.id AND is_active = true
    )
    AND DATE(ir.submitted_at) = CURRENT_DATE
  ) AS total_remaining_today
FROM rank_rent_sites s
LEFT JOIN google_search_console_integrations gi 
  ON gi.site_id = s.id AND gi.is_active = true
GROUP BY s.id, s.site_name, s.owner_user_id;