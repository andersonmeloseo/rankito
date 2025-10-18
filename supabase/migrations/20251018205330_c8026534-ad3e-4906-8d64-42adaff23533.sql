-- Add contract management fields to rank_rent_sites
ALTER TABLE rank_rent_sites
ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_applicable',
ADD COLUMN IF NOT EXISTS next_payment_date DATE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Update contract_status for existing records
UPDATE rank_rent_sites
SET contract_status = CASE
  WHEN is_rented = false THEN 'available'
  WHEN contract_end_date < CURRENT_DATE THEN 'expired'
  WHEN contract_end_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring_soon'
  ELSE 'active'
END
WHERE contract_status = 'available';

-- Create view for contract status
CREATE OR REPLACE VIEW rank_rent_contract_status AS
SELECT 
  s.id,
  s.site_name,
  s.client_id,
  s.contract_start_date,
  s.contract_end_date,
  s.monthly_rent_value,
  s.contract_status,
  s.payment_status,
  s.next_payment_date,
  s.auto_renew,
  CASE
    WHEN s.is_rented = false THEN 'available'
    WHEN s.contract_end_date IS NULL THEN 'active'
    WHEN s.contract_end_date < CURRENT_DATE THEN 'expired'
    WHEN s.contract_end_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring_soon'
    ELSE 'active'
  END as computed_status,
  CASE 
    WHEN s.contract_end_date IS NOT NULL THEN s.contract_end_date - CURRENT_DATE 
    ELSE NULL 
  END as days_remaining,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone
FROM rank_rent_sites s
LEFT JOIN rank_rent_clients c ON c.id = s.client_id;

-- Create function to auto-assign pages when site is rented
CREATE OR REPLACE FUNCTION auto_assign_pages_to_client()
RETURNS TRIGGER AS $$
BEGIN
  -- When a site is rented to a client, update all its pages
  IF NEW.is_rented = true AND NEW.client_id IS NOT NULL THEN
    UPDATE rank_rent_pages
    SET 
      client_id = NEW.client_id,
      is_rented = true,
      monthly_rent_value = 0 -- Value is in the site, not individual pages
    WHERE site_id = NEW.id;
    
    -- Update contract status
    NEW.contract_status := CASE
      WHEN NEW.contract_end_date IS NULL THEN 'active'
      WHEN NEW.contract_end_date < CURRENT_DATE THEN 'expired'
      WHEN NEW.contract_end_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'expiring_soon'
      ELSE 'active'
    END;
    
    NEW.payment_status := 'current';
    
  -- When a site is unrented, clear all page assignments
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
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assigning pages
DROP TRIGGER IF EXISTS trigger_auto_assign_pages ON rank_rent_sites;
CREATE TRIGGER trigger_auto_assign_pages
BEFORE UPDATE ON rank_rent_sites
FOR EACH ROW
WHEN (OLD.client_id IS DISTINCT FROM NEW.client_id OR OLD.is_rented IS DISTINCT FROM NEW.is_rented)
EXECUTE FUNCTION auto_assign_pages_to_client();

-- Create function to update contract status daily
CREATE OR REPLACE FUNCTION update_contract_statuses()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;