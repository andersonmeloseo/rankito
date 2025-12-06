
-- Create conversion_goals table
CREATE TABLE public.conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Goal configuration
  goal_name TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('cta_match', 'page_destination', 'url_pattern', 'combined')),
  
  -- CTA matching conditions
  cta_patterns TEXT[] DEFAULT '{}',        -- Partial match patterns
  cta_exact_matches TEXT[] DEFAULT '{}',   -- Exact CTA texts selected
  
  -- Page destination conditions
  page_urls TEXT[] DEFAULT '{}',           -- Pages that count as conversion
  
  -- URL pattern conditions (for click destinations)
  url_patterns TEXT[] DEFAULT '{}',        -- wa.me, tel:, mailto:, etc
  
  -- Value and priority
  conversion_value NUMERIC DEFAULT 0,
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to rank_rent_conversions for goal tracking
ALTER TABLE rank_rent_conversions
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES conversion_goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS goal_name TEXT,
ADD COLUMN IF NOT EXISTS conversion_value NUMERIC DEFAULT 0;

-- Create function to get detected CTAs per site
CREATE OR REPLACE FUNCTION public.get_detected_ctas(p_site_id UUID)
RETURNS TABLE (
  cta_text TEXT,
  event_type TEXT,
  click_count BIGINT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.cta_text,
    c.event_type::TEXT,
    COUNT(*)::BIGINT as click_count,
    MIN(c.created_at) as first_seen,
    MAX(c.created_at) as last_seen
  FROM rank_rent_conversions c
  WHERE c.site_id = p_site_id
    AND c.cta_text IS NOT NULL
    AND c.cta_text != ''
    AND c.event_type != 'page_view'
    AND c.event_type != 'page_exit'
    -- Filter out common navigation/system CTAs
    AND c.cta_text NOT ILIKE '%<svg%'
    AND c.cta_text NOT ILIKE '%<img%'
    AND c.cta_text NOT ILIKE '%menu%'
    AND c.cta_text NOT ILIKE '%nav%'
    AND LENGTH(c.cta_text) > 1
    AND LENGTH(c.cta_text) < 200
  GROUP BY c.cta_text, c.event_type
  ORDER BY click_count DESC;
END;
$$;

-- Enable RLS
ALTER TABLE conversion_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own site goals"
ON conversion_goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = conversion_goals.site_id
    AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert own site goals"
ON conversion_goals FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = conversion_goals.site_id
    AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
  )
);

CREATE POLICY "Users can update own site goals"
ON conversion_goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = conversion_goals.site_id
    AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
  )
);

CREATE POLICY "Users can delete own site goals"
ON conversion_goals FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = conversion_goals.site_id
    AND (s.owner_user_id = auth.uid() OR s.created_by_user_id = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_conversion_goals_updated_at
BEFORE UPDATE ON conversion_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
