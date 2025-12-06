-- Adicionar coluna has_advanced_tracking na tabela subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN has_advanced_tracking BOOLEAN DEFAULT false;

-- Atualizar planos existentes (Professional e Enterprise têm acesso)
UPDATE subscription_plans SET has_advanced_tracking = true WHERE slug IN ('professional', 'enterprise');
UPDATE subscription_plans SET has_advanced_tracking = false WHERE slug IN ('free', 'starter');