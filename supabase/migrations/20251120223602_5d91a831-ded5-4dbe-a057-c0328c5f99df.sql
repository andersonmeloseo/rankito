-- Add new columns to support_tickets for bidirectional communication
ALTER TABLE support_tickets 
ADD COLUMN initiated_by text NOT NULL DEFAULT 'user' CHECK (initiated_by IN ('user', 'admin')),
ADD COLUMN is_broadcast boolean NOT NULL DEFAULT false,
ADD COLUMN recipient_user_id uuid REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX idx_support_tickets_recipient ON support_tickets(recipient_user_id);
CREATE INDEX idx_support_tickets_broadcast ON support_tickets(is_broadcast) WHERE is_broadcast = true;

-- Update RLS policies to handle admin-initiated messages
CREATE POLICY "Users can view broadcast messages"
ON support_tickets
FOR SELECT
USING (
  is_broadcast = true 
  OR auth.uid() = user_id 
  OR (recipient_user_id IS NOT NULL AND auth.uid() = recipient_user_id)
);

-- Allow admins to create tickets for users
CREATE POLICY "Super admins can create messages for users"
ON support_tickets
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
);