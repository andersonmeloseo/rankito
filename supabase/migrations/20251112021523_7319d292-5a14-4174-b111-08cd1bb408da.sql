-- Criar tabela de controle de importação de sitemaps
CREATE TABLE sitemap_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  sitemap_url TEXT NOT NULL,
  total_sitemaps_found INTEGER DEFAULT 0,
  sitemaps_processed INTEGER DEFAULT 0,
  total_urls_expected INTEGER DEFAULT 0,
  urls_imported INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para busca rápida por site
CREATE INDEX idx_sitemap_jobs_site_id ON sitemap_import_jobs(site_id);

-- Habilitar RLS
ALTER TABLE sitemap_import_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own import jobs
CREATE POLICY "Users can view own import jobs"
  ON sitemap_import_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites 
      WHERE id = sitemap_import_jobs.site_id 
      AND owner_user_id = auth.uid()
    )
  );

-- Policy: Users can manage own import jobs
CREATE POLICY "Users can manage own import jobs"
  ON sitemap_import_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites 
      WHERE id = sitemap_import_jobs.site_id 
      AND owner_user_id = auth.uid()
    )
  );