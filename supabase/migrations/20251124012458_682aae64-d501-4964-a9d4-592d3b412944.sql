-- Tornar site_id nullable nas tabelas GBP
-- Isso permite que perfis GBP existam independentemente de sites

ALTER TABLE gbp_reviews 
ALTER COLUMN site_id DROP NOT NULL;

ALTER TABLE gbp_analytics 
ALTER COLUMN site_id DROP NOT NULL;

ALTER TABLE gbp_posts 
ALTER COLUMN site_id DROP NOT NULL;

ALTER TABLE gbp_photos 
ALTER COLUMN site_id DROP NOT NULL;

ALTER TABLE gbp_questions 
ALTER COLUMN site_id DROP NOT NULL;