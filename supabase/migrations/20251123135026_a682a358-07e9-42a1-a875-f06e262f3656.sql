-- Migration: Create marketing_metrics table and update early_access_leads
CREATE TABLE marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('landing_visitors', 'early_access_leads', 'trials_started', 'paid_conversions', 'churn')),
  value INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_metrics ENABLE ROW LEVEL SECURITY;

-- Super admins can manage metrics
CREATE POLICY "Super admins can manage metrics"
  ON marketing_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create indexes
CREATE INDEX idx_marketing_metrics_date ON marketing_metrics(date DESC);
CREATE INDEX idx_marketing_metrics_type ON marketing_metrics(metric_type);
CREATE INDEX idx_marketing_metrics_campaign ON marketing_metrics(campaign_id);

-- Add foreign key to early_access_leads
ALTER TABLE early_access_leads
  ADD CONSTRAINT fk_early_access_campaign 
  FOREIGN KEY (campaign_id) 
  REFERENCES marketing_campaigns(id) 
  ON DELETE SET NULL;

-- Add index for converted users
CREATE INDEX idx_early_access_converted ON early_access_leads(converted_to_user_id) WHERE converted_to_user_id IS NOT NULL;