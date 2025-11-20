-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System can insert audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Super admins can insert audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Super admins can read all audit logs" ON admin_audit_logs;

-- Enable RLS on admin_audit_logs table
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow super admins to insert audit logs
CREATE POLICY "Super admins can insert audit logs"
ON admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Allow super admins to read all audit logs
CREATE POLICY "Super admins can read all audit logs"
ON admin_audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Allow system (service role) to insert logs
CREATE POLICY "System can insert audit logs"
ON admin_audit_logs FOR INSERT
TO service_role
WITH CHECK (true);