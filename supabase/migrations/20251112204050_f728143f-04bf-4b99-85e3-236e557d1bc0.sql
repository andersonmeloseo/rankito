-- Fase 1: Migração para Service Account JSON

-- 1. Adicionar coluna para armazenar JSON da Service Account
ALTER TABLE google_search_console_integrations
ADD COLUMN service_account_json JSONB;

-- 2. Tornar campos OAuth2 opcionais (antes de remover)
ALTER TABLE google_search_console_integrations
ALTER COLUMN access_token DROP NOT NULL,
ALTER COLUMN refresh_token DROP NOT NULL,
ALTER COLUMN token_expires_at DROP NOT NULL;

-- 3. Tornar google_email e gsc_property_url opcionais (serão preenchidos automaticamente)
ALTER TABLE google_search_console_integrations
ALTER COLUMN google_email DROP NOT NULL,
ALTER COLUMN gsc_property_url DROP NOT NULL;

-- 4. Remover constraint única antiga que usava google_client_id
ALTER TABLE google_search_console_integrations
DROP CONSTRAINT IF EXISTS google_search_console_integrations_site_id_google_client__key;

-- 5. Adicionar nova constraint única usando connection_name
ALTER TABLE google_search_console_integrations
ADD CONSTRAINT google_search_console_integrations_site_id_connection_na_key 
UNIQUE (site_id, connection_name);

-- 6. Remover colunas OAuth2 (após migração estar completa)
ALTER TABLE google_search_console_integrations
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS token_expires_at,
DROP COLUMN IF EXISTS google_client_id,
DROP COLUMN IF EXISTS google_client_secret;

-- 7. Deletar tabela oauth_states (não é mais necessária)
DROP TABLE IF EXISTS oauth_states;

-- 8. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_gsc_integrations_service_account 
ON google_search_console_integrations(site_id, is_active) 
WHERE service_account_json IS NOT NULL;