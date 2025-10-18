-- Fix security issues from previous migration

-- Drop and recreate functions with proper search_path
DROP FUNCTION IF EXISTS auto_assign_pages_to_client() CASCADE;
CREATE OR REPLACE FUNCTION auto_assign_pages_to_client()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a site is rented to a client, update all its pages
  IF NEW.is_rented = true AND NEW.client_id IS NOT NULL THEN
    UPDATE rank_rent_pages
    SET 
      client_id = NEW.client_id,
      is_rented = true,
      monthly_rent_value = 0
    WHERE site_id = NEW.id;
    
    -- Update contract status
    NEW.contract_status := CASE
      WHEN NEW.contract_end_date IS NULL THEN 'active'
      WHEN NEW.contract_end_date < CURRENT_DATE THEN 'expired'
      WHEN NEW.contract_end_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring_soon'
      ELSE 'active'
    END;
    
    NEW.payment_status := 'current';
    
  ELSIF NEW.is_rented = false THEN
    UPDATE rank_rent_pages
    SET 
      client_id = NULL,
      is_rented = false,
      monthly_rent_value = 0
    WHERE site_id = NEW.id;
    
    NEW.contract_status := 'available';
    NEW.payment_status := 'not_applicable';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_pages ON rank_rent_sites;
CREATE TRIGGER trigger_auto_assign_pages
BEFORE UPDATE ON rank_rent_sites
FOR EACH ROW
WHEN (OLD.client_id IS DISTINCT FROM NEW.client_id OR OLD.is_rented IS DISTINCT FROM NEW.is_rented)
EXECUTE FUNCTION auto_assign_pages_to_client();

-- Fix update_contract_statuses function
DROP FUNCTION IF EXISTS update_contract_statuses();
CREATE OR REPLACE FUNCTION update_contract_statuses()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE rank_rent_sites
  SET contract_status = CASE
    WHEN is_rented = false THEN 'available'
    WHEN contract_end_date IS NULL THEN 'active'
    WHEN contract_end_date < CURRENT_DATE THEN 'expired'
    WHEN contract_end_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring_soon'
    ELSE 'active'
  END,
  payment_status = CASE
    WHEN is_rented = false THEN 'not_applicable'
    WHEN next_payment_date IS NULL THEN 'current'
    WHEN next_payment_date < CURRENT_DATE THEN 'overdue'
    WHEN next_payment_date <= (CURRENT_DATE + INTERVAL '7 days') THEN 'due_soon'
    ELSE 'current'
  END
  WHERE is_rented = true;
END;
$$;