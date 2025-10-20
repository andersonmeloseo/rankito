-- Create enum for external source types
CREATE TYPE external_source_type AS ENUM ('wordpress', 'chrome_extension', 'api', 'manual');

-- Create external_lead_sources table
CREATE TABLE public.external_lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type external_source_type NOT NULL DEFAULT 'wordpress',
  source_name TEXT NOT NULL,
  api_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  site_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{"total_leads": 0, "last_lead_at": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_lead_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_lead_sources
CREATE POLICY "Users can view own sources"
  ON public.external_lead_sources
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sources"
  ON public.external_lead_sources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sources"
  ON public.external_lead_sources
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sources"
  ON public.external_lead_sources
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all sources"
  ON public.external_lead_sources
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Add columns to crm_deals
ALTER TABLE public.crm_deals 
  ADD COLUMN external_source TEXT,
  ADD COLUMN source_metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);

-- Create index for better performance
CREATE INDEX idx_external_lead_sources_user_id ON public.external_lead_sources(user_id);
CREATE INDEX idx_external_lead_sources_api_token ON public.external_lead_sources(api_token);
CREATE INDEX idx_crm_deals_external_source ON public.crm_deals(external_source);

-- Trigger to update updated_at
CREATE TRIGGER update_external_lead_sources_updated_at
  BEFORE UPDATE ON public.external_lead_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();