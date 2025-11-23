-- Refatoração GBP: Service Account → OAuth2

-- Adicionar colunas OAuth2 à tabela google_business_profiles
ALTER TABLE google_business_profiles 
ADD COLUMN access_token TEXT,
ADD COLUMN refresh_token TEXT,
ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE;

-- Remover coluna service_account_json (dados antigos serão perdidos - aceitável pois feature não estava funcionando)
ALTER TABLE google_business_profiles 
DROP COLUMN service_account_json;

-- Adicionar índice para performance em queries de token expirado
CREATE INDEX idx_gbp_token_expires ON google_business_profiles(token_expires_at) WHERE is_active = true;