-- Add RLS policies to allow edge function to insert conversions
CREATE POLICY "Allow edge function to insert conversions"
ON rank_rent_conversions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add RLS policy to allow edge function to update conversions if needed
CREATE POLICY "Allow edge function to update conversions"
ON rank_rent_conversions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);