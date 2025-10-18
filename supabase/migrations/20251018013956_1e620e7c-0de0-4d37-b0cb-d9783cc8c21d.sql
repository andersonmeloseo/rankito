-- Adicionar coluna tracking_token na tabela rank_rent_sites
ALTER TABLE rank_rent_sites 
ADD COLUMN tracking_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Gerar tokens para sites existentes (caso não tenham)
UPDATE rank_rent_sites 
SET tracking_token = encode(gen_random_bytes(32), 'hex')
WHERE tracking_token IS NULL;

-- Criar índice para melhorar performance de busca por token
CREATE INDEX IF NOT EXISTS idx_rank_rent_sites_tracking_token 
ON rank_rent_sites(tracking_token);