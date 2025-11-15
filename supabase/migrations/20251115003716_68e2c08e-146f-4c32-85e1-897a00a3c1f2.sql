-- Adicionar coluna para chave IndexNow
ALTER TABLE rank_rent_sites 
ADD COLUMN IF NOT EXISTS indexnow_key TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_rank_rent_sites_indexnow_key 
ON rank_rent_sites(indexnow_key) 
WHERE indexnow_key IS NOT NULL;

-- Função para gerar chave hexadecimal (32 caracteres)
CREATE OR REPLACE FUNCTION generate_indexnow_key()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Gerar chaves para sites existentes que não têm
UPDATE rank_rent_sites 
SET indexnow_key = generate_indexnow_key()
WHERE indexnow_key IS NULL;

-- Trigger para gerar chave automaticamente em novos sites
CREATE OR REPLACE FUNCTION set_indexnow_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.indexnow_key IS NULL THEN
    NEW.indexnow_key := generate_indexnow_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_indexnow_key
  BEFORE INSERT ON rank_rent_sites
  FOR EACH ROW
  EXECUTE FUNCTION set_indexnow_key();