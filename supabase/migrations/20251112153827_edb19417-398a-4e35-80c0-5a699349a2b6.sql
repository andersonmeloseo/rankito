-- ETAPA 1: Limpar leads fake do CRM (28 leads de cliques sem contato)
-- Deletar atividades relacionadas aos leads fake primeiro
DELETE FROM crm_activities
WHERE deal_id IN (
  SELECT id FROM crm_deals
  WHERE source = 'external_wordpress'
  AND external_source = 'Advogados Pelo Brasil'
  AND title LIKE '%Lead via%click%'
  AND contact_email IS NULL
);

-- Deletar os leads fake
DELETE FROM crm_deals
WHERE source = 'external_wordpress'
AND external_source = 'Advogados Pelo Brasil'
AND title LIKE '%Lead via%click%'
AND contact_email IS NULL;

-- ETAPA 2: Desativar integração que cria leads automaticamente
UPDATE external_lead_sources
SET is_active = false
WHERE source_name = 'Advogados Pelo Brasil'
AND source_type = 'wordpress';

-- ETAPA 3: Garantir que auto-conversão global está desabilitada
-- Desabilitar auto-conversão para TODOS os usuários existentes
UPDATE auto_conversion_settings
SET enabled = false
WHERE enabled = true;

-- Inserir configuração padrão desabilitada para usuários sem configuração
INSERT INTO auto_conversion_settings (user_id, enabled)
SELECT DISTINCT id, false
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auto_conversion_settings)
ON CONFLICT (user_id) DO UPDATE SET enabled = false;