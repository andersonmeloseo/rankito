-- Add archived column to support_tickets table
ALTER TABLE support_tickets 
ADD COLUMN archived BOOLEAN DEFAULT false;

-- Add index for better query performance on archived tickets
CREATE INDEX idx_support_tickets_archived ON support_tickets(archived);

-- Update RLS policies to handle archived tickets
-- Super admins can still see all tickets including archived
-- Users can see their own tickets including archived ones