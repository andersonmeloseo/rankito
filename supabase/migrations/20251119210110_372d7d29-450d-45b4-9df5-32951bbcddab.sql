-- Criar tabela para submissions de sitemaps GSC
CREATE TABLE IF NOT EXISTS public.gsc_sitemap_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.google_search_console_integrations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.rank_rent_sites(id) ON DELETE CASCADE,
  sitemap_url TEXT NOT NULL,
  sitemap_type TEXT,
  gsc_status TEXT,
  gsc_last_submitted TIMESTAMPTZ,
  gsc_last_downloaded TIMESTAMPTZ,
  page_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gsc_sitemap_submissions_unique_integration_url UNIQUE (integration_id, sitemap_url)
);

-- Habilitar RLS
ALTER TABLE public.gsc_sitemap_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own sitemap submissions"
  ON public.gsc_sitemap_submissions
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM public.rank_rent_sites 
      WHERE created_by_user_id = auth.uid() OR owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sitemap submissions"
  ON public.gsc_sitemap_submissions
  FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.rank_rent_sites 
      WHERE created_by_user_id = auth.uid() OR owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sitemap submissions"
  ON public.gsc_sitemap_submissions
  FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM public.rank_rent_sites 
      WHERE created_by_user_id = auth.uid() OR owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own sitemap submissions"
  ON public.gsc_sitemap_submissions
  FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM public.rank_rent_sites 
      WHERE created_by_user_id = auth.uid() OR owner_user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX idx_gsc_sitemap_submissions_integration ON public.gsc_sitemap_submissions(integration_id);
CREATE INDEX idx_gsc_sitemap_submissions_site ON public.gsc_sitemap_submissions(site_id);
CREATE INDEX idx_gsc_sitemap_submissions_status ON public.gsc_sitemap_submissions(gsc_status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gsc_sitemap_submissions_updated_at
  BEFORE UPDATE ON public.gsc_sitemap_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();