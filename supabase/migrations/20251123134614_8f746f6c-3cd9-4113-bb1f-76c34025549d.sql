-- Migration: Create early_access_leads table
CREATE TABLE early_access_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  num_sites TEXT NOT NULL CHECK (num_sites IN ('1-5', '6-10', '11-20', '21-50', '50+')),
  main_pain TEXT NOT NULL,
  accept_communication BOOLEAN DEFAULT true,
  referral_source TEXT,
  utm_params JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected')),
  campaign_id UUID,
  converted_to_user_id UUID
);

-- Enable RLS
ALTER TABLE early_access_leads ENABLE ROW LEVEL SECURITY;

-- Super admins can view all leads
CREATE POLICY "Super admins can view all leads"
  ON early_access_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Super admins can update leads
CREATE POLICY "Super admins can update leads"
  ON early_access_leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Anyone can insert lead (public registration)
CREATE POLICY "Anyone can insert lead"
  ON early_access_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create index for email lookups
CREATE INDEX idx_early_access_leads_email ON early_access_leads(email);
CREATE INDEX idx_early_access_leads_status ON early_access_leads(status);
CREATE INDEX idx_early_access_leads_created_at ON early_access_leads(created_at DESC);