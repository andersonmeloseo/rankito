-- Adicionar novos campos à tabela user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paused_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(current_period_end);

-- Criar tabela de histórico de assinaturas
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Índices para subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON subscription_history(created_at DESC);

-- RLS Policies para subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view history"
  ON subscription_history FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert history"
  ON subscription_history FOR INSERT
  WITH CHECK (true);

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO subscription_history (
      subscription_id,
      action,
      old_values,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_history (
      subscription_id,
      action,
      new_values,
      changed_by
    ) VALUES (
      NEW.id,
      'create',
      to_jsonb(NEW),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para rastrear mudanças em assinaturas
CREATE TRIGGER track_subscription_changes
AFTER INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION log_subscription_change();