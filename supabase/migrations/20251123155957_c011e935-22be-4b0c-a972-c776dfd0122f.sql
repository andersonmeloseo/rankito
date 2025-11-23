-- ================================================
-- GOOGLE BUSINESS PROFILE MANAGEMENT
-- Complete Database Infrastructure
-- ================================================

-- 1. Tabela: google_business_profiles
-- Armazena conexões OAuth2 com contas Google Business Profile
CREATE TABLE google_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  connection_name TEXT NOT NULL,
  google_email TEXT NOT NULL,
  
  -- OAuth2 Credentials
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- GBP Location Info
  location_name TEXT, -- e.g., "accounts/123/locations/456"
  business_name TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_categories TEXT[], -- Array de categorias
  
  -- Health & Sync
  is_active BOOLEAN DEFAULT true,
  health_status TEXT DEFAULT 'healthy', -- healthy, warning, error
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT gbp_site_connection_unique UNIQUE(site_id, connection_name)
);

CREATE INDEX idx_gbp_user_site ON google_business_profiles(user_id, site_id);
CREATE INDEX idx_gbp_active ON google_business_profiles(is_active);
CREATE INDEX idx_gbp_health ON google_business_profiles(health_status);

-- 2. Tabela: gbp_reviews
-- Armazena avaliações sincronizadas do GBP
CREATE TABLE gbp_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  
  -- Google Review Data
  google_review_id TEXT NOT NULL UNIQUE,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  review_text TEXT,
  review_reply TEXT,
  review_reply_at TIMESTAMPTZ,
  
  -- Status
  is_replied BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  sentiment TEXT, -- positive, neutral, negative
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gbp_reviews_profile ON gbp_reviews(profile_id, created_at DESC);
CREATE INDEX idx_gbp_reviews_site ON gbp_reviews(site_id, created_at DESC);
CREATE INDEX idx_gbp_reviews_unread ON gbp_reviews(site_id, is_read) WHERE is_read = false;
CREATE INDEX idx_gbp_reviews_unanswered ON gbp_reviews(site_id, is_replied) WHERE is_replied = false;
CREATE INDEX idx_gbp_reviews_rating ON gbp_reviews(site_id, star_rating);

-- 3. Tabela: gbp_posts
-- Armazena posts publicados no Google Business Profile
CREATE TABLE gbp_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  
  -- Post Data
  google_post_id TEXT UNIQUE,
  post_type TEXT NOT NULL, -- STANDARD, EVENT, OFFER, PRODUCT
  title TEXT,
  content TEXT NOT NULL,
  cta_type TEXT, -- CALL, BOOK, ORDER, LEARN_MORE, SIGN_UP
  cta_url TEXT,
  
  -- Media
  media_urls TEXT[],
  
  -- Event/Offer Specific
  event_start_date TIMESTAMPTZ,
  event_end_date TIMESTAMPTZ,
  offer_coupon_code TEXT,
  offer_terms TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metrics
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gbp_posts_profile ON gbp_posts(profile_id, created_at DESC);
CREATE INDEX idx_gbp_posts_site ON gbp_posts(site_id, status, created_at DESC);
CREATE INDEX idx_gbp_posts_scheduled ON gbp_posts(scheduled_for) WHERE status = 'scheduled';

-- 4. Tabela: gbp_analytics
-- Armazena métricas agregadas diárias do GBP
CREATE TABLE gbp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  
  -- Date Range
  metric_date DATE NOT NULL,
  
  -- Search Metrics
  searches_direct INTEGER DEFAULT 0,
  searches_discovery INTEGER DEFAULT 0,
  searches_branded INTEGER DEFAULT 0,
  
  -- Action Metrics
  actions_website INTEGER DEFAULT 0,
  actions_phone INTEGER DEFAULT 0,
  actions_directions INTEGER DEFAULT 0,
  
  -- Photo Metrics
  photos_views_merchant INTEGER DEFAULT 0,
  photos_views_customers INTEGER DEFAULT 0,
  photos_count_merchant INTEGER DEFAULT 0,
  photos_count_customers INTEGER DEFAULT 0,
  
  -- Engagement
  profile_views INTEGER DEFAULT 0,
  profile_clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT gbp_analytics_unique UNIQUE(profile_id, metric_date)
);

CREATE INDEX idx_gbp_analytics_profile_date ON gbp_analytics(profile_id, metric_date DESC);
CREATE INDEX idx_gbp_analytics_site_date ON gbp_analytics(site_id, metric_date DESC);

-- 5. Tabela: gbp_oauth_states
-- Armazena estados temporários do fluxo OAuth2
CREATE TABLE gbp_oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  state_token TEXT NOT NULL UNIQUE,
  connection_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gbp_oauth_states_token ON gbp_oauth_states(state_token);
CREATE INDEX idx_gbp_oauth_states_expires ON gbp_oauth_states(expires_at);

-- 6. RLS Policies para google_business_profiles
ALTER TABLE google_business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GBP profiles"
  ON google_business_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = google_business_profiles.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own GBP profiles"
  ON google_business_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = google_business_profiles.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- 7. RLS Policies para gbp_reviews
ALTER TABLE gbp_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site reviews"
  ON gbp_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gbp_reviews.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own site reviews"
  ON gbp_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gbp_reviews.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- 8. RLS Policies para gbp_posts
ALTER TABLE gbp_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site posts"
  ON gbp_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gbp_posts.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own site posts"
  ON gbp_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gbp_posts.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- 9. RLS Policies para gbp_analytics
ALTER TABLE gbp_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site analytics"
  ON gbp_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gbp_analytics.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- 10. RLS Policies para gbp_oauth_states
ALTER TABLE gbp_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own oauth states"
  ON gbp_oauth_states FOR ALL
  USING (auth.uid() = user_id);

-- 11. Atualizar subscription_plans com limites GBP
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_gbp_integrations INTEGER DEFAULT 0;

-- Configurar limites por plano
UPDATE subscription_plans SET max_gbp_integrations = 0 WHERE slug = 'free';
UPDATE subscription_plans SET max_gbp_integrations = 1 WHERE slug = 'starter';
UPDATE subscription_plans SET max_gbp_integrations = 3 WHERE slug = 'professional';
UPDATE subscription_plans SET max_gbp_integrations = NULL WHERE slug = 'enterprise';

-- 12. Trigger para updated_at
CREATE TRIGGER update_gbp_profiles_updated_at
  BEFORE UPDATE ON google_business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gbp_reviews_updated_at
  BEFORE UPDATE ON gbp_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gbp_posts_updated_at
  BEFORE UPDATE ON gbp_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. Realtime para reviews (notificações em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE gbp_reviews;