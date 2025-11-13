-- Adicionar coluna trial_days à tabela subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN trial_days integer DEFAULT 0;

-- Comentário na coluna
COMMENT ON COLUMN subscription_plans.trial_days IS 'Número de dias de trial oferecidos por este plano';

-- Atualizar planos existentes com valores padrão de trial
UPDATE subscription_plans 
SET trial_days = CASE 
  WHEN slug = 'free' THEN 0
  WHEN slug = 'starter' THEN 7
  WHEN slug = 'professional' THEN 14
  WHEN slug = 'enterprise' THEN 30
  ELSE 0
END;

-- Adicionar índice para melhorar performance de queries de trial expirado
CREATE INDEX idx_user_subscriptions_trial_expired 
ON user_subscriptions(status, trial_end_date) 
WHERE trial_end_date IS NOT NULL;