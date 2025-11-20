-- Criar enum para tipos de regras de automação
CREATE TYPE automation_rule_type AS ENUM (
  'auto_approval',
  'trial_expiration',
  'plan_renewal',
  'plan_upgrade',
  'custom_notification'
);

-- Criar enum para status de execução
CREATE TYPE automation_execution_status AS ENUM (
  'success',
  'failed',
  'skipped'
);

-- Tabela de regras de automação
CREATE TABLE admin_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type automation_rule_type NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 50,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de logs de execução
CREATE TABLE automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES admin_automation_rules(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id),
  execution_status automation_execution_status NOT NULL,
  execution_details JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_automation_rules_type ON admin_automation_rules(rule_type);
CREATE INDEX idx_automation_rules_active ON admin_automation_rules(is_active);
CREATE INDEX idx_automation_logs_rule ON automation_execution_logs(rule_id);
CREATE INDEX idx_automation_logs_user ON automation_execution_logs(target_user_id);
CREATE INDEX idx_automation_logs_executed_at ON automation_execution_logs(executed_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON admin_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- RLS Policies
ALTER TABLE admin_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- Super admins podem gerenciar tudo
CREATE POLICY "Super admins can manage automation rules"
  ON admin_automation_rules
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view execution logs"
  ON automation_execution_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Sistema pode inserir logs de execução
CREATE POLICY "System can insert execution logs"
  ON automation_execution_logs
  FOR INSERT
  WITH CHECK (true);