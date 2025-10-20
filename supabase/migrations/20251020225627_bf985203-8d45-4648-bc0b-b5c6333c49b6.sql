-- Tabela para configurações de auto-conversão
CREATE TABLE IF NOT EXISTS auto_conversion_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  whatsapp_click_enabled BOOLEAN DEFAULT true,
  phone_click_enabled BOOLEAN DEFAULT true,
  form_submit_enabled BOOLEAN DEFAULT true,
  email_click_enabled BOOLEAN DEFAULT false,
  whatsapp_score INTEGER DEFAULT 80,
  phone_score INTEGER DEFAULT 70,
  form_score INTEGER DEFAULT 90,
  email_score INTEGER DEFAULT 50,
  default_stage TEXT DEFAULT 'lead',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE auto_conversion_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON auto_conversion_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON auto_conversion_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON auto_conversion_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_auto_conversion_settings_updated_at
  BEFORE UPDATE ON auto_conversion_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();