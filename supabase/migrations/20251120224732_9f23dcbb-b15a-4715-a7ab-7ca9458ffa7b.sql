-- Remover política duplicada
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;

-- Renomear política existente para deixar mais claro
DROP POLICY IF EXISTS "Users can view broadcast messages" ON support_tickets;

-- Criar política consolidada que cobre todos os casos
CREATE POLICY "Users can view their tickets and broadcasts" 
ON support_tickets 
FOR SELECT 
TO authenticated
USING (
  (is_broadcast = true) 
  OR (auth.uid() = user_id) 
  OR ((recipient_user_id IS NOT NULL) AND (auth.uid() = recipient_user_id))
);