-- Create CRM Deals Table
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES rank_rent_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  source TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  target_niche TEXT,
  target_location TEXT,
  CONSTRAINT valid_stage CHECK (stage IN ('lead', 'contact', 'proposal', 'negotiation', 'won', 'lost'))
);

CREATE INDEX idx_crm_deals_user_id ON crm_deals(user_id);
CREATE INDEX idx_crm_deals_client_id ON crm_deals(client_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);

-- Create CRM Tasks Table
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES rank_rent_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'call',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  outcome TEXT,
  notes TEXT,
  CONSTRAINT valid_type CHECK (type IN ('call', 'email', 'meeting', 'whatsapp', 'follow_up', 'other')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'canceled'))
);

CREATE INDEX idx_crm_tasks_user_id ON crm_tasks(user_id);
CREATE INDEX idx_crm_tasks_deal_id ON crm_tasks(deal_id);
CREATE INDEX idx_crm_tasks_client_id ON crm_tasks(client_id);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);

-- Create CRM Activities Table
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES rank_rent_clients(id) ON DELETE CASCADE,
  task_id UUID REFERENCES crm_tasks(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_activity_type CHECK (activity_type IN (
    'call', 'email', 'meeting', 'whatsapp', 'note', 
    'status_change', 'deal_created', 'deal_won', 'deal_lost',
    'task_completed', 'contract_signed', 'payment_received'
  ))
);

CREATE INDEX idx_crm_activities_user_id ON crm_activities(user_id);
CREATE INDEX idx_crm_activities_deal_id ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_client_id ON crm_activities(client_id);
CREATE INDEX idx_crm_activities_created_at ON crm_activities(created_at DESC);

-- Create CRM Notes Table
CREATE TABLE crm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES rank_rent_clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_notes_user_id ON crm_notes(user_id);
CREATE INDEX idx_crm_notes_deal_id ON crm_notes(deal_id);
CREATE INDEX idx_crm_notes_client_id ON crm_notes(client_id);

-- Create CRM Email Templates Table
CREATE TABLE crm_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'email',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_email_templates_user_id ON crm_email_templates(user_id);

-- Create Views for Analysis
CREATE VIEW crm_sales_funnel AS
SELECT 
  user_id,
  stage,
  COUNT(*) as deal_count,
  SUM(value) as total_value,
  AVG(probability) as avg_probability,
  SUM(value * (probability / 100.0)) as weighted_value
FROM crm_deals
WHERE stage NOT IN ('won', 'lost')
GROUP BY user_id, stage;

CREATE VIEW crm_conversion_metrics AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE stage = 'lead') as leads,
  COUNT(*) FILTER (WHERE stage = 'won') as won_deals,
  COUNT(*) FILTER (WHERE stage = 'lost') as lost_deals,
  COUNT(*) FILTER (WHERE stage IN ('contact', 'proposal', 'negotiation')) as active_deals,
  ROUND(
    (COUNT(*) FILTER (WHERE stage = 'won')::DECIMAL / 
    NULLIF(COUNT(*) FILTER (WHERE stage IN ('won', 'lost')), 0) * 100), 
    2
  ) as win_rate,
  SUM(value) FILTER (WHERE stage = 'won') as total_won_value,
  AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) FILTER (WHERE stage = 'won') as avg_days_to_close
FROM crm_deals
GROUP BY user_id;

-- Create Trigger Function for Deal Activity Logging
CREATE OR REPLACE FUNCTION log_deal_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO crm_activities (user_id, deal_id, activity_type, title, description)
    VALUES (NEW.user_id, NEW.id, 'deal_created', 
            'Deal criado: ' || NEW.title, 
            'Deal criado no estágio: ' || NEW.stage);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stage != NEW.stage THEN
      INSERT INTO crm_activities (user_id, deal_id, activity_type, title, description, metadata)
      VALUES (NEW.user_id, NEW.id, 'status_change', 
              'Mudança de estágio', 
              'De "' || OLD.stage || '" para "' || NEW.stage || '"',
              jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage));
      
      IF NEW.stage = 'won' THEN
        INSERT INTO crm_activities (user_id, deal_id, activity_type, title, description)
        VALUES (NEW.user_id, NEW.id, 'deal_won', 
                'Deal ganho!', 
                'Valor: R$ ' || NEW.value);
      END IF;
      
      IF NEW.stage = 'lost' THEN
        INSERT INTO crm_activities (user_id, deal_id, activity_type, title, description)
        VALUES (NEW.user_id, NEW.id, 'deal_lost', 
                'Deal perdido', 
                'Motivo: ' || COALESCE(NEW.lost_reason, 'Não especificado'));
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_deal_activity
AFTER INSERT OR UPDATE ON crm_deals
FOR EACH ROW EXECUTE FUNCTION log_deal_activity();

-- Create Trigger for Updated_at
CREATE TRIGGER update_crm_deals_updated_at 
BEFORE UPDATE ON crm_deals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at 
BEFORE UPDATE ON crm_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_notes_updated_at 
BEFORE UPDATE ON crm_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_email_templates_updated_at 
BEFORE UPDATE ON crm_email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_deals
CREATE POLICY "Users can view own deals" ON crm_deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deals" ON crm_deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals" ON crm_deals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deals" ON crm_deals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for crm_tasks
CREATE POLICY "Users can manage own tasks" ON crm_tasks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for crm_activities
CREATE POLICY "Users can view own activities" ON crm_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activities" ON crm_activities
  FOR INSERT WITH CHECK (true);

-- RLS Policies for crm_notes
CREATE POLICY "Users can manage own notes" ON crm_notes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for crm_email_templates
CREATE POLICY "Users can manage own templates" ON crm_email_templates
  FOR ALL USING (auth.uid() = user_id);