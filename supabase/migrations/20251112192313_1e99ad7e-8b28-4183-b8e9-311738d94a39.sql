-- Fase 1: Modificações no Banco de Dados para GSC Multi-Credenciais

-- 1. Adicionar coluna max_gsc_integrations à tabela subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_gsc_integrations INTEGER DEFAULT 0;

COMMENT ON COLUMN subscription_plans.max_gsc_integrations IS 'Número máximo de integrações GSC permitidas. NULL = ilimitado, 0 = nenhuma';

-- 2. Configurar valores padrão para planos existentes
UPDATE subscription_plans SET max_gsc_integrations = 0 WHERE slug = 'free';
UPDATE subscription_plans SET max_gsc_integrations = 1 WHERE slug IN ('starter', 'professional');
UPDATE subscription_plans SET max_gsc_integrations = NULL WHERE slug = 'enterprise';

-- 3. Modificar tabela google_search_console_integrations
-- Adicionar novas colunas para credenciais por projeto
ALTER TABLE google_search_console_integrations 
ADD COLUMN IF NOT EXISTS connection_name TEXT NOT NULL DEFAULT 'Conexão Principal',
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS google_client_id TEXT,
ADD COLUMN IF NOT EXISTS google_client_secret TEXT;

-- Remover constraint UNIQUE(user_id, site_id) se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'google_search_console_integrations_user_id_site_id_key'
  ) THEN
    ALTER TABLE google_search_console_integrations 
    DROP CONSTRAINT google_search_console_integrations_user_id_site_id_key;
  END IF;
END $$;

-- Adicionar constraint UNIQUE(site_id, google_client_id)
-- Permite múltiplas integrações por site, desde que usem diferentes credenciais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'google_search_console_integrations_site_id_client_id_key'
  ) THEN
    ALTER TABLE google_search_console_integrations 
    ADD CONSTRAINT google_search_console_integrations_site_id_client_id_key 
    UNIQUE (site_id, google_client_id);
  END IF;
END $$;

-- 4. Criar tabela oauth_states para gerenciar fluxo OAuth temporário
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para consultas rápidas por state
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- RLS para oauth_states
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para oauth_states
CREATE POLICY "Users can view own oauth states"
ON oauth_states FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth states"
ON oauth_states FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Edge functions can manage oauth states"
ON oauth_states FOR ALL
USING (true);

-- Função para limpar estados OAuth expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM oauth_states
  WHERE expires_at < now();
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE oauth_states IS 'Armazena estados temporários do fluxo OAuth2 do Google Search Console';
COMMENT ON COLUMN oauth_states.state IS 'Token único gerado para validar callback OAuth';
COMMENT ON COLUMN oauth_states.integration_id IS 'Referência à integração GSC sendo configurada';
COMMENT ON COLUMN oauth_states.expires_at IS 'Data/hora de expiração do state (padrão: 10 minutos)';

-- Atualizar comentários das novas colunas
COMMENT ON COLUMN google_search_console_integrations.connection_name IS 'Nome identificador da conexão GSC';
COMMENT ON COLUMN google_search_console_integrations.google_email IS 'Email da conta Google usada na integração';
COMMENT ON COLUMN google_search_console_integrations.google_client_id IS 'Client ID do projeto Google Cloud';
COMMENT ON COLUMN google_search_console_integrations.google_client_secret IS 'Client Secret do projeto Google Cloud (criptografado)';