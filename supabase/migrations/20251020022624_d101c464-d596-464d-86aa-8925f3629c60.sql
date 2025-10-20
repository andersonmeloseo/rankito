-- 1. Adicionar coluna para vincular end_client ao cliente
ALTER TABLE rank_rent_clients 
ADD COLUMN end_client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Criar índice para performance
CREATE INDEX idx_rank_rent_clients_end_client_user_id 
ON rank_rent_clients(end_client_user_id);

-- 3. Garantir que cada end_client está vinculado a apenas 1 cliente
CREATE UNIQUE INDEX idx_unique_end_client_per_client 
ON rank_rent_clients(end_client_user_id) 
WHERE end_client_user_id IS NOT NULL;

-- 4. Função para sincronizar datas de contrato do cliente baseado nos sites
CREATE OR REPLACE FUNCTION sync_client_contract_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar datas do cliente baseado nos sites alugados
  UPDATE rank_rent_clients
  SET 
    contract_start_date = (
      SELECT MIN(contract_start_date) 
      FROM rank_rent_sites 
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) 
        AND is_rented = true
    ),
    contract_end_date = (
      SELECT MAX(contract_end_date) 
      FROM rank_rent_sites 
      WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) 
        AND is_rented = true
    )
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para sincronizar quando sites mudarem
DROP TRIGGER IF EXISTS trigger_sync_client_contract_dates ON rank_rent_sites;
CREATE TRIGGER trigger_sync_client_contract_dates
AFTER INSERT OR UPDATE OR DELETE ON rank_rent_sites
FOR EACH ROW
EXECUTE FUNCTION sync_client_contract_dates();

-- 6. Sincronizar datas existentes (executar uma vez)
UPDATE rank_rent_clients c
SET 
  contract_start_date = (
    SELECT MIN(contract_start_date) 
    FROM rank_rent_sites 
    WHERE client_id = c.id AND is_rented = true
  ),
  contract_end_date = (
    SELECT MAX(contract_end_date) 
    FROM rank_rent_sites 
    WHERE client_id = c.id AND is_rented = true
  )
WHERE EXISTS (
  SELECT 1 FROM rank_rent_sites WHERE client_id = c.id AND is_rented = true
);