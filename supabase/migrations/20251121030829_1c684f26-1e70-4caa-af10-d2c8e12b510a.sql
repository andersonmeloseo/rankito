-- Tabela para armazenar histórico de auditorias do sistema
CREATE TABLE IF NOT EXISTS public.system_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'warning', 'critical')),
  total_issues INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  info_count INTEGER NOT NULL DEFAULT 0,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar auditorias recentes
CREATE INDEX idx_system_audit_reports_executed_at ON public.system_audit_reports(executed_at DESC);

-- Index para buscar por executor
CREATE INDEX idx_system_audit_reports_executed_by ON public.system_audit_reports(executed_by);

-- RLS Policies
ALTER TABLE public.system_audit_reports ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver todos os relatórios
CREATE POLICY "Super admins can view all audit reports"
  ON public.system_audit_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- System pode inserir relatórios
CREATE POLICY "System can insert audit reports"
  ON public.system_audit_reports
  FOR INSERT
  WITH CHECK (true);