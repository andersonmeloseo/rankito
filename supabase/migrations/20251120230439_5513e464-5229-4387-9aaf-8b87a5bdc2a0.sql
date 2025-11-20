-- Remover constraint antigo
ALTER TABLE user_notifications DROP CONSTRAINT IF EXISTS user_notifications_type_check;

-- Adicionar constraint atualizado com os tipos de tickets
ALTER TABLE user_notifications ADD CONSTRAINT user_notifications_type_check 
CHECK (type IN (
  'conversion', 
  'contract_expiry', 
  'gsc_quota', 
  'gsc_indexed', 
  'limit_reached', 
  'payment_due', 
  'system',
  'ticket_created',
  'ticket_reply_admin',
  'ticket_reply_user'
));