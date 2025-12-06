
-- Create table for user-configured marketing campaigns linked to conversion goals
CREATE TABLE public.marketing_campaign_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.rank_rent_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  goal_id UUID REFERENCES public.conversion_goals(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  utm_campaign_pattern TEXT,
  utm_source_pattern TEXT,
  utm_medium_pattern TEXT,
  budget NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaign_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own site campaigns"
ON public.marketing_campaign_configs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM rank_rent_sites s
  WHERE s.id = marketing_campaign_configs.site_id
  AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
));

CREATE POLICY "Users can insert own site campaigns"
ON public.marketing_campaign_configs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = marketing_campaign_configs.site_id
    AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
  )
);

CREATE POLICY "Users can update own site campaigns"
ON public.marketing_campaign_configs
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM rank_rent_sites s
  WHERE s.id = marketing_campaign_configs.site_id
  AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
));

CREATE POLICY "Users can delete own site campaigns"
ON public.marketing_campaign_configs
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM rank_rent_sites s
  WHERE s.id = marketing_campaign_configs.site_id
  AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
));

-- Trigger for updated_at
CREATE TRIGGER update_marketing_campaign_configs_updated_at
BEFORE UPDATE ON public.marketing_campaign_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_marketing_campaign_configs_site_id ON public.marketing_campaign_configs(site_id);
CREATE INDEX idx_marketing_campaign_configs_goal_id ON public.marketing_campaign_configs(goal_id);
