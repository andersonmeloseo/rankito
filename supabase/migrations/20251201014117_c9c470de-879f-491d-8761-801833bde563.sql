-- Remover todas as tabelas relacionadas ao Google Business Profile
-- Ordem respeitando foreign keys

-- 1. Dropar tabelas dependentes primeiro
DROP TABLE IF EXISTS gbp_site_associations CASCADE;
DROP TABLE IF EXISTS gbp_analytics CASCADE;
DROP TABLE IF EXISTS gbp_notifications CASCADE;
DROP TABLE IF EXISTS gbp_photos CASCADE;
DROP TABLE IF EXISTS gbp_posts CASCADE;
DROP TABLE IF EXISTS gbp_questions CASCADE;
DROP TABLE IF EXISTS gbp_reviews CASCADE;

-- 2. Dropar tabela principal
DROP TABLE IF EXISTS google_business_profiles CASCADE;

-- 3. Remover coluna max_gbp_integrations da tabela subscription_plans (se existir)
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS max_gbp_integrations;