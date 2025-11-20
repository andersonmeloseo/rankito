-- Criar tabela de configuração de agendamento
CREATE TABLE IF NOT EXISTS gsc_schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Configuração de frequência
  enabled BOOLEAN DEFAULT TRUE,
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'custom'
  interval_hours INTEGER, -- Para custom: a cada X horas
  specific_days INTEGER[], -- Para semanal: [0,1,2,3,4,5,6] (domingo=0)
  specific_time TIME DEFAULT '00:30', -- Horário preferido
  
  -- Controles
  max_urls_per_run INTEGER DEFAULT 200,
  distribute_across_day BOOLEAN DEFAULT TRUE,
  pause_on_quota_exceeded BOOLEAN DEFAULT TRUE,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  UNIQUE(site_id)
);

-- Índices para performance
CREATE INDEX idx_gsc_schedule_config_site_id ON gsc_schedule_config(site_id);
CREATE INDEX idx_gsc_schedule_config_next_run ON gsc_schedule_config(next_run_at) WHERE enabled = TRUE;

-- RLS Policies
ALTER TABLE gsc_schedule_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule configs"
  ON gsc_schedule_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_schedule_config.site_id
      AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own schedule configs"
  ON gsc_schedule_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_schedule_config.site_id
      AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own schedule configs"
  ON gsc_schedule_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_schedule_config.site_id
      AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own schedule configs"
  ON gsc_schedule_config FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites
      WHERE rank_rent_sites.id = gsc_schedule_config.site_id
      AND rank_rent_sites.owner_user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gsc_schedule_config_updated_at
  BEFORE UPDATE ON gsc_schedule_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();