-- Migration: Create marketing_campaigns table
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('google_ads', 'linkedin', 'facebook', 'seo', 'referral', 'email', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  budget_total DECIMAL(10,2),
  budget_spent DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  tracking_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Super admins can manage campaigns
CREATE POLICY "Super admins can manage campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Create indexes
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX idx_marketing_campaigns_dates ON marketing_campaigns(start_date, end_date);