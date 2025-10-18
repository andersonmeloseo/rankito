-- Add geolocation columns to rank_rent_conversions table
ALTER TABLE rank_rent_conversions 
ADD COLUMN city text,
ADD COLUMN region text,
ADD COLUMN country text,
ADD COLUMN country_code text;

-- Add index on city for better query performance
CREATE INDEX idx_rank_rent_conversions_city ON rank_rent_conversions(city);

-- Add index on country for analytics
CREATE INDEX idx_rank_rent_conversions_country ON rank_rent_conversions(country);