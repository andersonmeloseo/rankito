-- Tabela de agendamentos de sitemaps
CREATE TABLE IF NOT EXISTS public.gsc_sitemap_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.rank_rent_sites(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.google_search_console_integrations(id) ON DELETE SET NULL,
  
  -- Nome do agendamento
  schedule_name TEXT NOT NULL,
  
  -- Tipo de intervalo
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  interval_hours INTEGER, -- Para custom schedule
  
  -- Sitemaps a enviar (NULL = todos, array = específicos)
  sitemap_paths TEXT[], -- Se NULL, envia todos os sitemaps
  
  -- Controle de execução
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_interval_hours CHECK (
    (schedule_type = 'custom' AND interval_hours IS NOT NULL AND interval_hours > 0)
    OR (schedule_type != 'custom')
  )
);

-- Tabela de logs de execução de agendamentos
CREATE TABLE IF NOT EXISTS public.gsc_schedule_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.gsc_sitemap_schedules(id) ON DELETE CASCADE,
  
  -- Dados da execução
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial_success', 'error')),
  
  -- Detalhes
  sitemaps_attempted TEXT[] NOT NULL,
  sitemaps_succeeded TEXT[],
  sitemaps_failed TEXT[],
  
  error_message TEXT,
  execution_duration_ms INTEGER,
  
  -- Metadados
  integration_id UUID REFERENCES public.google_search_console_integrations(id) ON DELETE SET NULL,
  integration_name TEXT
);

-- Índices para performance
CREATE INDEX idx_gsc_sitemap_schedules_site_id ON public.gsc_sitemap_schedules(site_id);
CREATE INDEX idx_gsc_sitemap_schedules_next_run ON public.gsc_sitemap_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_gsc_schedule_execution_logs_schedule ON public.gsc_schedule_execution_logs(schedule_id, executed_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gsc_sitemap_schedules_updated_at
  BEFORE UPDATE ON public.gsc_sitemap_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.gsc_sitemap_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_schedule_execution_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios agendamentos
CREATE POLICY "Users can view their own schedules"
  ON public.gsc_sitemap_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_sitemap_schedules.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem criar agendamentos para seus sites
CREATE POLICY "Users can create schedules for their sites"
  ON public.gsc_sitemap_schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar seus agendamentos
CREATE POLICY "Users can update their own schedules"
  ON public.gsc_sitemap_schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_sitemap_schedules.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem deletar seus agendamentos
CREATE POLICY "Users can delete their own schedules"
  ON public.gsc_sitemap_schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_sitemap_schedules.site_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem ver logs dos seus agendamentos
CREATE POLICY "Users can view logs of their schedules"
  ON public.gsc_schedule_execution_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gsc_sitemap_schedules
      JOIN rank_rent_sites ON rank_rent_sites.id = gsc_sitemap_schedules.site_id
      WHERE gsc_sitemap_schedules.id = gsc_schedule_execution_logs.schedule_id
        AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- Policy: Service role pode inserir logs (para edge functions)
CREATE POLICY "Service role can insert logs"
  ON public.gsc_schedule_execution_logs
  FOR INSERT
  WITH CHECK (true);