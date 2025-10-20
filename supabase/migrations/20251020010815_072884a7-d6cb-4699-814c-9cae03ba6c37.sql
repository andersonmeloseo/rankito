-- Adicionar campo follow_up_date à tabela crm_deals
ALTER TABLE crm_deals
ADD COLUMN follow_up_date timestamp with time zone;

-- Criar índice para melhorar performance em queries de follow-up
CREATE INDEX idx_crm_deals_follow_up_date ON crm_deals(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Criar índice composto para otimizar queries de deals por usuário e data
CREATE INDEX idx_crm_deals_user_follow_up ON crm_deals(user_id, follow_up_date) WHERE follow_up_date IS NOT NULL;