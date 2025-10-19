-- Sprint 2.1: Add site_id to crm_deals
ALTER TABLE crm_deals 
ADD COLUMN site_id UUID REFERENCES rank_rent_sites(id) ON DELETE SET NULL;

CREATE INDEX idx_crm_deals_site_id ON crm_deals(site_id);

-- Sprint 2.2: Create pipeline stages configuration table
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT 'bg-slate-100',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, stage_key)
);

-- Enable RLS
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own stages" ON crm_pipeline_stages
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default stages for existing users
INSERT INTO crm_pipeline_stages (user_id, stage_key, label, color, display_order, is_system)
SELECT 
  id as user_id,
  stage_key,
  label,
  color,
  display_order,
  true as is_system
FROM profiles
CROSS JOIN (
  VALUES 
    ('lead', 'Lead', 'bg-slate-100', 1),
    ('contact', 'Contato', 'bg-blue-100', 2),
    ('proposal', 'Proposta', 'bg-purple-100', 3),
    ('negotiation', 'Negociação', 'bg-yellow-100', 4),
    ('won', 'Ganho', 'bg-green-100', 5),
    ('lost', 'Perdido', 'bg-red-100', 6)
) AS stages(stage_key, label, color, display_order);

-- Trigger to create default stages for new users
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO crm_pipeline_stages (user_id, stage_key, label, color, display_order, is_system)
  VALUES 
    (NEW.id, 'lead', 'Lead', 'bg-slate-100', 1, true),
    (NEW.id, 'contact', 'Contato', 'bg-blue-100', 2, true),
    (NEW.id, 'proposal', 'Proposta', 'bg-purple-100', 3, true),
    (NEW.id, 'negotiation', 'Negociação', 'bg-yellow-100', 4, true),
    (NEW.id, 'won', 'Ganho', 'bg-green-100', 5, true),
    (NEW.id, 'lost', 'Perdido', 'bg-red-100', 6, true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_default_pipeline_stages
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION create_default_pipeline_stages();

-- Update trigger for updated_at
CREATE TRIGGER update_crm_pipeline_stages_updated_at
BEFORE UPDATE ON crm_pipeline_stages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();