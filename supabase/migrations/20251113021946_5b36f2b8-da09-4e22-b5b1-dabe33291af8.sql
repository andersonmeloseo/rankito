-- Adicionar coluna stripe_checkout_url à tabela subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN stripe_checkout_url text;

COMMENT ON COLUMN subscription_plans.stripe_checkout_url IS 'URL de checkout do Stripe para este plano';