-- Fase 2: Adicionar colunas para integração com Google Ads e Meta Ads
ALTER TABLE rank_rent_conversions 
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS email_hash text,
  ADD COLUMN IF NOT EXISTS phone_hash text;

-- Índices para otimizar consultas de exportação
CREATE INDEX IF NOT EXISTS idx_conversions_gclid ON rank_rent_conversions(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_fbclid ON rank_rent_conversions(fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_utm_source ON rank_rent_conversions(utm_source) WHERE utm_source IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN rank_rent_conversions.gclid IS 'Google Click ID para atribuição de conversões offline';
COMMENT ON COLUMN rank_rent_conversions.fbclid IS 'Facebook Click ID da URL';
COMMENT ON COLUMN rank_rent_conversions.fbc IS 'Facebook Click Cookie (_fbc)';
COMMENT ON COLUMN rank_rent_conversions.fbp IS 'Facebook Browser ID Cookie (_fbp)';
COMMENT ON COLUMN rank_rent_conversions.utm_source IS 'UTM Source parameter';
COMMENT ON COLUMN rank_rent_conversions.utm_medium IS 'UTM Medium parameter';
COMMENT ON COLUMN rank_rent_conversions.utm_campaign IS 'UTM Campaign parameter';
COMMENT ON COLUMN rank_rent_conversions.utm_content IS 'UTM Content parameter';
COMMENT ON COLUMN rank_rent_conversions.utm_term IS 'UTM Term parameter';
COMMENT ON COLUMN rank_rent_conversions.email_hash IS 'SHA256 hash do email para CAPI';
COMMENT ON COLUMN rank_rent_conversions.phone_hash IS 'SHA256 hash do telefone para CAPI';