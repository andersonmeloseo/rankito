-- Create enum types for support system
CREATE TYPE support_category AS ENUM ('bug_report', 'feature_request', 'question', 'technical_support', 'other');
CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
CREATE TYPE support_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create support_tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category support_category NOT NULL DEFAULT 'other',
  status support_status NOT NULL DEFAULT 'open',
  priority support_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_admin_count INTEGER NOT NULL DEFAULT 0,
  unread_user_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create support_messages table
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_support_tickets_user_status ON support_tickets(user_id, status, last_message_at DESC);
CREATE INDEX idx_support_tickets_status ON support_tickets(status, last_message_at DESC);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to, status);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id, created_at ASC);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets status to closed"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'closed');

CREATE POLICY "Super admins can manage all tickets"
  ON support_tickets FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages from own tickets"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND is_internal_note = false
  );

CREATE POLICY "Users can send messages to own tickets"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
    AND is_internal_note = false
    AND is_admin_reply = false
  );

CREATE POLICY "Super admins can manage all messages"
  ON support_messages FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to update ticket's last_message_at and unread counters
CREATE OR REPLACE FUNCTION update_ticket_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    unread_admin_count = CASE 
      WHEN NEW.is_admin_reply = false AND NEW.is_internal_note = false THEN unread_admin_count + 1
      ELSE unread_admin_count
    END,
    unread_user_count = CASE 
      WHEN NEW.is_admin_reply = true AND NEW.is_internal_note = false THEN unread_user_count + 1
      ELSE unread_user_count
    END
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_ticket_on_message
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_new_message();

-- Function to create notification when ticket is created or replied
CREATE OR REPLACE FUNCTION create_ticket_notification()
RETURNS TRIGGER AS $$
DECLARE
  admin_ids UUID[];
  admin_id UUID;
BEGIN
  -- If it's a new ticket, notify all super admins
  IF TG_OP = 'INSERT' THEN
    SELECT ARRAY_AGG(user_id) INTO admin_ids
    FROM user_roles
    WHERE role = 'super_admin'::app_role;
    
    FOREACH admin_id IN ARRAY admin_ids LOOP
      INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
      VALUES (
        admin_id,
        'ticket_created',
        'Novo Ticket de Suporte',
        'Ticket #' || SUBSTRING(NEW.id::text, 1, 8) || ' - ' || NEW.subject,
        '/super-admin?tab=communication&ticket=' || NEW.id,
        jsonb_build_object('ticket_id', NEW.id, 'category', NEW.category, 'priority', NEW.priority)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_ticket_notification
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_ticket_notification();

-- Function to create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  ticket_user_id UUID;
  ticket_subject TEXT;
BEGIN
  -- Skip internal notes
  IF NEW.is_internal_note THEN
    RETURN NEW;
  END IF;
  
  SELECT user_id, subject INTO ticket_user_id, ticket_subject
  FROM support_tickets
  WHERE id = NEW.ticket_id;
  
  -- If admin replied, notify user
  IF NEW.is_admin_reply THEN
    INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      ticket_user_id,
      'ticket_reply_admin',
      'Nova Resposta no Ticket',
      'Seu ticket "' || ticket_subject || '" recebeu uma resposta',
      '/support?ticket=' || NEW.ticket_id,
      jsonb_build_object('ticket_id', NEW.ticket_id, 'message_id', NEW.id)
    );
  ELSE
    -- If user replied, notify assigned admin (or all admins if unassigned)
    DECLARE
      admin_ids UUID[];
      admin_id UUID;
      assigned_admin UUID;
    BEGIN
      SELECT assigned_to INTO assigned_admin
      FROM support_tickets
      WHERE id = NEW.ticket_id;
      
      IF assigned_admin IS NOT NULL THEN
        INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
        VALUES (
          assigned_admin,
          'ticket_reply_user',
          'Nova Mensagem no Ticket',
          'Ticket #' || SUBSTRING(NEW.ticket_id::text, 1, 8) || ' - ' || ticket_subject,
          '/super-admin?tab=communication&ticket=' || NEW.ticket_id,
          jsonb_build_object('ticket_id', NEW.ticket_id, 'message_id', NEW.id)
        );
      ELSE
        SELECT ARRAY_AGG(user_id) INTO admin_ids
        FROM user_roles
        WHERE role = 'super_admin'::app_role;
        
        FOREACH admin_id IN ARRAY admin_ids LOOP
          INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
          VALUES (
            admin_id,
            'ticket_reply_user',
            'Nova Mensagem no Ticket',
            'Ticket #' || SUBSTRING(NEW.ticket_id::text, 1, 8) || ' - ' || ticket_subject,
            '/super-admin?tab=communication&ticket=' || NEW.ticket_id,
            jsonb_build_object('ticket_id', NEW.ticket_id, 'message_id', NEW.id)
          );
        END LOOP;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Enable realtime for support tables
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;