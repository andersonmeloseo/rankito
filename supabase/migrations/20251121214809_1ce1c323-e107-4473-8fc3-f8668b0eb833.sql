-- Add is_ecommerce column to rank_rent_sites table
ALTER TABLE rank_rent_sites 
ADD COLUMN is_ecommerce BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_rank_rent_sites_is_ecommerce ON rank_rent_sites(is_ecommerce);

-- Add comment for documentation
COMMENT ON COLUMN rank_rent_sites.is_ecommerce IS 'Indicates if this site is an e-commerce project with product tracking and sales monitoring';