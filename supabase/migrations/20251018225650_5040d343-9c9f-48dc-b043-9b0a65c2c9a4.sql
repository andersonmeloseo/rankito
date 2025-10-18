-- Fix function search path for update_last_activity
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET last_activity_at = now()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;