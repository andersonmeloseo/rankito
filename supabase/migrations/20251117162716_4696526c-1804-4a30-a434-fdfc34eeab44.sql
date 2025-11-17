-- Step 1: Add new e-commerce event types to the event_type enum
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'product_view';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'add_to_cart';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'remove_from_cart';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'begin_checkout';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'purchase';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'search';

-- Step 2: Add is_ecommerce_event column to rank_rent_conversions
ALTER TABLE rank_rent_conversions 
ADD COLUMN IF NOT EXISTS is_ecommerce_event BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN rank_rent_conversions.is_ecommerce_event IS 'Indicates if this conversion is an e-commerce event (product_view, add_to_cart, purchase, etc.)';

-- Step 3: Create indexes for e-commerce queries
CREATE INDEX IF NOT EXISTS idx_conversions_ecommerce 
ON rank_rent_conversions(site_id, event_type, created_at) 
WHERE is_ecommerce_event = TRUE;

CREATE INDEX IF NOT EXISTS idx_conversions_revenue 
ON rank_rent_conversions(site_id, created_at) 
WHERE event_type = 'purchase' AND metadata ? 'revenue';