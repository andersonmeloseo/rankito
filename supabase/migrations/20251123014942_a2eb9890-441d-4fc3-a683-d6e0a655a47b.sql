-- Limpeza completa dos dados de teste de broadcast

-- 1. Deletar mensagens associadas aos tickets broadcast
DELETE FROM support_messages
WHERE ticket_id IN (
  SELECT id FROM support_tickets WHERE is_broadcast = true
);

-- 2. Deletar tickets broadcast
DELETE FROM support_tickets
WHERE is_broadcast = true;

-- 3. Deletar notificações relacionadas (últimas 24h)
DELETE FROM user_notifications
WHERE type IN ('ticket_created', 'broadcast_sent')
  AND created_at > NOW() - INTERVAL '24 hours';