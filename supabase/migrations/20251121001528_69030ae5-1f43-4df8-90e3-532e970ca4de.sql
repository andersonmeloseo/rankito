-- Criar tabela para tracking de uso do Mapbox
CREATE TABLE IF NOT EXISTS public.mapbox_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL,
  map_loads_count INTEGER NOT NULL DEFAULT 0,
  limit_reached BOOLEAN NOT NULL DEFAULT false,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_month UNIQUE(user_id, month_year)
);

-- Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_mapbox_usage_month_year ON public.mapbox_usage_tracking(month_year);
CREATE INDEX IF NOT EXISTS idx_mapbox_usage_user_id ON public.mapbox_usage_tracking(user_id);

-- RLS Policies
ALTER TABLE public.mapbox_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios registros
CREATE POLICY "Users can view own mapbox usage"
  ON public.mapbox_usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios registros
CREATE POLICY "Users can insert own mapbox usage"
  ON public.mapbox_usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios registros
CREATE POLICY "Users can update own mapbox usage"
  ON public.mapbox_usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Sistema pode gerenciar todos os registros (para cron job)
CREATE POLICY "System can manage all mapbox usage"
  ON public.mapbox_usage_tracking
  FOR ALL
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_mapbox_usage_tracking_updated_at
  BEFORE UPDATE ON public.mapbox_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();