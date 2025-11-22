-- Criar tabela de sessões
CREATE TABLE rank_rent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  entry_page_url TEXT NOT NULL,
  exit_page_url TEXT,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  total_duration_seconds INTEGER,
  pages_visited INTEGER DEFAULT 1,
  device TEXT,
  referrer TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_sessions_site ON rank_rent_sessions(site_id);
CREATE INDEX idx_sessions_session_id ON rank_rent_sessions(session_id);
CREATE INDEX idx_sessions_entry_time ON rank_rent_sessions(entry_time DESC);

-- Criar tabela de visitas de página
CREATE TABLE rank_rent_page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES rank_rent_sessions(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT,
  sequence_number INTEGER NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_visits_session ON rank_rent_page_visits(session_id);
CREATE INDEX idx_visits_site ON rank_rent_page_visits(site_id);
CREATE INDEX idx_visits_sequence ON rank_rent_page_visits(session_id, sequence_number);
CREATE INDEX idx_visits_entry_time ON rank_rent_page_visits(entry_time DESC);

-- RLS Policies para rank_rent_sessions
ALTER TABLE rank_rent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow edge function to insert sessions"
  ON rank_rent_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow edge function to update sessions"
  ON rank_rent_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own sessions"
  ON rank_rent_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = rank_rent_sessions.site_id
      AND (rank_rent_sites.owner_user_id = auth.uid() OR rank_rent_sites.created_by_user_id = auth.uid())
    )
  );

CREATE POLICY "Super admins can view all sessions"
  ON rank_rent_sessions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Public can view sessions for active portals"
  ON rank_rent_sessions FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM rank_rent_sites s
      JOIN client_portal_analytics cpa ON cpa.client_id = s.client_id
      WHERE cpa.enabled = true
    )
  );

-- RLS Policies para rank_rent_page_visits
ALTER TABLE rank_rent_page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow edge function to insert visits"
  ON rank_rent_page_visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow edge function to update visits"
  ON rank_rent_page_visits FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own visits"
  ON rank_rent_page_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = rank_rent_page_visits.site_id
      AND (rank_rent_sites.owner_user_id = auth.uid() OR rank_rent_sites.created_by_user_id = auth.uid())
    )
  );

CREATE POLICY "Super admins can view all visits"
  ON rank_rent_page_visits FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Public can view visits for active portals"
  ON rank_rent_page_visits FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM rank_rent_sites s
      JOIN client_portal_analytics cpa ON cpa.client_id = s.client_id
      WHERE cpa.enabled = true
    )
  );