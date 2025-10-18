-- Create financial configuration table
CREATE TABLE rank_rent_financial_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  site_id uuid REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  page_id uuid REFERENCES rank_rent_pages(id) ON DELETE CASCADE,
  
  -- Costs
  cost_per_conversion numeric DEFAULT 0 CHECK (cost_per_conversion >= 0),
  monthly_fixed_costs numeric DEFAULT 0 CHECK (monthly_fixed_costs >= 0),
  acquisition_cost numeric DEFAULT 0 CHECK (acquisition_cost >= 0),
  
  -- Configuration
  business_model text CHECK (business_model IN ('per_page', 'full_site')),
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure it's either site OR page level
  CONSTRAINT financial_config_level CHECK (
    (site_id IS NOT NULL AND page_id IS NULL) OR
    (site_id IS NULL AND page_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE rank_rent_financial_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own financial config"
  ON rank_rent_financial_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rank_rent_sites s
      WHERE s.id = rank_rent_financial_config.site_id
      AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM rank_rent_pages p
      JOIN rank_rent_sites s ON s.id = p.site_id
      WHERE p.id = rank_rent_financial_config.page_id
      AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rank_rent_sites s
      WHERE s.id = rank_rent_financial_config.site_id
      AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM rank_rent_pages p
      JOIN rank_rent_sites s ON s.id = p.site_id
      WHERE p.id = rank_rent_financial_config.page_id
      AND s.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_financial_config_updated_at
  BEFORE UPDATE ON rank_rent_financial_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for financial metrics
CREATE OR REPLACE VIEW rank_rent_financial_metrics AS
WITH page_financials AS (
  SELECT 
    p.id as page_id,
    p.site_id,
    p.page_url,
    p.page_title,
    p.page_path,
    p.monthly_rent_value,
    p.is_rented,
    p.client_id,
    c.name as client_name,
    
    -- Conversion metrics
    COALESCE(pm.total_conversions, 0) as total_conversions,
    COALESCE(pm.total_page_views, 0) as total_page_views,
    COALESCE(pm.conversion_rate, 0) as conversion_rate,
    
    -- Financial configuration
    COALESCE(fc.cost_per_conversion, 0) as cost_per_conversion,
    COALESCE(fc.monthly_fixed_costs, 0) as monthly_fixed_costs,
    COALESCE(fc.acquisition_cost, 0) as acquisition_cost,
    fc.business_model,
    
    -- Financial calculations
    p.monthly_rent_value as monthly_revenue,
    (COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0)) as monthly_conversion_costs,
    (
      p.monthly_rent_value - 
      (COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0)) -
      COALESCE(fc.monthly_fixed_costs, 0)
    ) as monthly_profit,
    
    -- ROI calculation
    CASE 
      WHEN (COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0) + COALESCE(fc.monthly_fixed_costs, 0)) > 0
      THEN (
        (p.monthly_rent_value - (COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0)) - COALESCE(fc.monthly_fixed_costs, 0)) 
        / 
        (COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0) + COALESCE(fc.monthly_fixed_costs, 0))
      ) * 100
      ELSE 0
    END as roi_percentage,
    
    -- Cost per revenue generated
    CASE 
      WHEN p.monthly_rent_value > 0
      THEN ((COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0) + COALESCE(fc.monthly_fixed_costs, 0)) / p.monthly_rent_value) * 100
      ELSE 0
    END as cost_revenue_ratio,
    
    -- Profit margin
    CASE 
      WHEN p.monthly_rent_value > 0
      THEN ((p.monthly_rent_value - (COALESCE(pm.total_conversions, 0) * COALESCE(fc.cost_per_conversion, 0)) - COALESCE(fc.monthly_fixed_costs, 0)) / p.monthly_rent_value) * 100
      ELSE 0
    END as profit_margin,
    
    s.user_id
    
  FROM rank_rent_pages p
  LEFT JOIN rank_rent_page_metrics pm ON pm.page_id = p.id
  LEFT JOIN rank_rent_clients c ON c.id = p.client_id
  LEFT JOIN rank_rent_financial_config fc ON fc.page_id = p.id
  LEFT JOIN rank_rent_sites s ON s.id = p.site_id
  WHERE p.is_rented = true
)
SELECT * FROM page_financials;