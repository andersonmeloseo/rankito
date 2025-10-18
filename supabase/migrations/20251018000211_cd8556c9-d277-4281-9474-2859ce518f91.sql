-- Add niche column to rank_rent_clients table
ALTER TABLE rank_rent_clients 
ADD COLUMN niche TEXT;

-- Create index for better performance on niche filters
CREATE INDEX idx_clients_niche ON rank_rent_clients(niche);

-- Add comment for documentation
COMMENT ON COLUMN rank_rent_clients.niche IS 'Business niche/vertical of the client (e.g., Advogados, Dentistas, Encanadores)';