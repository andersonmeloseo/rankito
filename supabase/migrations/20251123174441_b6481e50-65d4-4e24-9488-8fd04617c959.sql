-- Fase 1: Ajustar schema do google_business_profiles
-- Tornar site_id opcional (permitir perfis GBP sem projeto associado)
ALTER TABLE google_business_profiles 
  ALTER COLUMN site_id DROP NOT NULL;

-- Criar tabela de associação entre perfis GBP e sites
CREATE TABLE IF NOT EXISTS gbp_site_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_profile_id UUID NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gbp_profile_id, site_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gbp_site_associations_profile ON gbp_site_associations(gbp_profile_id);
CREATE INDEX IF NOT EXISTS idx_gbp_site_associations_site ON gbp_site_associations(site_id);

-- RLS Policies para gbp_site_associations
ALTER TABLE gbp_site_associations ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver associações dos seus sites
CREATE POLICY "Users can view own site associations"
ON gbp_site_associations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gbp_site_associations.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

-- Usuários podem criar associações para seus sites
CREATE POLICY "Users can create own site associations"
ON gbp_site_associations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gbp_site_associations.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM google_business_profiles
    WHERE google_business_profiles.id = gbp_site_associations.gbp_profile_id
    AND google_business_profiles.user_id = auth.uid()
  )
);

-- Usuários podem deletar associações dos seus sites
CREATE POLICY "Users can delete own site associations"
ON gbp_site_associations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gbp_site_associations.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

-- Migrar dados existentes: criar associações baseadas no site_id atual
INSERT INTO gbp_site_associations (gbp_profile_id, site_id)
SELECT id, site_id
FROM google_business_profiles
WHERE site_id IS NOT NULL
ON CONFLICT (gbp_profile_id, site_id) DO NOTHING;

-- Atualizar RLS policies do google_business_profiles para trabalhar com user_id
DROP POLICY IF EXISTS "Users can view own site profiles" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can insert own site profiles" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can update own site profiles" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can delete own site profiles" ON google_business_profiles;

-- Novas policies baseadas em user_id
CREATE POLICY "Users can view own profiles"
ON google_business_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
ON google_business_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
ON google_business_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
ON google_business_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Atualizar políticas de reviews, posts e analytics para trabalhar com associações
-- Reviews: usuários podem ver reviews de perfis associados aos seus sites
DROP POLICY IF EXISTS "Users can view own sites reviews" ON gbp_reviews;
CREATE POLICY "Users can view associated profiles reviews"
ON gbp_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM google_business_profiles
    WHERE google_business_profiles.id = gbp_reviews.profile_id
    AND google_business_profiles.user_id = auth.uid()
  )
);

-- Posts: usuários podem gerenciar posts de seus perfis
DROP POLICY IF EXISTS "Users can manage own site posts" ON gbp_posts;
CREATE POLICY "Users can manage own profile posts"
ON gbp_posts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM google_business_profiles
    WHERE google_business_profiles.id = gbp_posts.profile_id
    AND google_business_profiles.user_id = auth.uid()
  )
);

-- Analytics: usuários podem ver analytics de seus perfis
DROP POLICY IF EXISTS "Users can view own site analytics" ON gbp_analytics;
CREATE POLICY "Users can view own profile analytics"
ON gbp_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM google_business_profiles
    WHERE google_business_profiles.id = gbp_analytics.profile_id
    AND google_business_profiles.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gbp_site_associations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gbp_site_associations_updated_at
BEFORE UPDATE ON gbp_site_associations
FOR EACH ROW
EXECUTE FUNCTION update_gbp_site_associations_updated_at();