-- Criar tabela para rastrear requisições de indexação por URL (para quota)
CREATE TABLE IF NOT EXISTS public.gsc_url_indexing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_gsc_url_indexing_requests_integration_date 
  ON public.gsc_url_indexing_requests(integration_id, created_at DESC);

CREATE INDEX idx_gsc_url_indexing_requests_site_date 
  ON public.gsc_url_indexing_requests(site_id, created_at DESC);

CREATE INDEX idx_gsc_url_indexing_requests_status 
  ON public.gsc_url_indexing_requests(status);

-- RLS Policies
ALTER TABLE public.gsc_url_indexing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own URL indexing requests"
  ON public.gsc_url_indexing_requests
  FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM rank_rent_sites 
      WHERE owner_user_id = auth.uid() OR created_by_user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gsc_url_indexing_requests_updated_at
  BEFORE UPDATE ON public.gsc_url_indexing_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();