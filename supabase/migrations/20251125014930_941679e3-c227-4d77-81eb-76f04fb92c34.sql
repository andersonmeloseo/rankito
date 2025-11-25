-- Remover constraint antiga
ALTER TABLE user_notifications 
DROP CONSTRAINT IF EXISTS user_notifications_type_check;

-- Criar constraint com todos os tipos necessários
ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_type_check 
CHECK (type = ANY (ARRAY[
  'conversion'::text, 
  'contract_expiry'::text, 
  'gsc_quota'::text, 
  'gsc_indexed'::text, 
  'limit_reached'::text, 
  'payment_due'::text, 
  'system'::text, 
  'ticket_created'::text, 
  'ticket_reply_admin'::text, 
  'ticket_reply_user'::text,
  'account_approved'::text,
  'account_rejected'::text,
  'broadcast_sent'::text
]));