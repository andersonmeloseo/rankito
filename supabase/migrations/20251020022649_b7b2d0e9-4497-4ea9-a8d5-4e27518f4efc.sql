-- Corrigir security warning: adicionar search_path na função
CREATE OR REPLACE FUNCTION sync_client_contract_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;