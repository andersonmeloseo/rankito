-- Adicionar novo tipo de notificação para broadcasts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    -- Se o tipo não existe, criar
    CREATE TYPE notification_type AS ENUM ('broadcast_sent');
  ELSE
    -- Se existe, tentar adicionar o valor
    BEGIN
      ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'broadcast_sent';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Modificar trigger para criar apenas 1 notificação agregada para broadcasts
CREATE OR REPLACE FUNCTION public.create_ticket_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  admin_ids UUID[];
  admin_id UUID;
  broadcast_count INT;
BEGIN
  -- If it's a new ticket
  IF TG_OP = 'INSERT' THEN
    
    -- Se for BROADCAST, criar apenas 1 notificação agregada
    IF NEW.is_broadcast = true THEN
      -- Contar quantos tickets deste broadcast já foram criados
      SELECT COUNT(*) INTO broadcast_count
      FROM support_tickets
      WHERE subject = NEW.subject
        AND is_broadcast = true
        AND created_at = NEW.created_at;
      
      -- Criar notificação apenas para o PRIMEIRO ticket do broadcast
      IF broadcast_count = 1 THEN
        SELECT ARRAY_AGG(user_id) INTO admin_ids
        FROM user_roles
        WHERE role = 'super_admin'::app_role;
        
        FOREACH admin_id IN ARRAY admin_ids LOOP
          INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
          VALUES (
            admin_id,
            'broadcast_sent',
            'Mensagem Broadcast Enviada',
            'Broadcast "' || NEW.subject || '" enviado para múltiplos usuários',
            '/super-admin?tab=communication',
            jsonb_build_object(
              'subject', NEW.subject,
              'category', NEW.category,
              'priority', NEW.priority,
              'is_broadcast', true
            )
          );
        END LOOP;
      END IF;
      
    ELSE
      -- Se NÃO for broadcast, criar notificação individual normal
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
    
  END IF;
  
  RETURN NEW;
END;
$function$;