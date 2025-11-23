-- Adicionar políticas RLS para deletar mensagens de suporte
-- Opção B: Super Admin pode deletar qualquer mensagem, usuários podem deletar suas próprias mensagens

-- Super admins podem deletar qualquer mensagem
CREATE POLICY "Super admins can delete any message"
ON support_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Usuários podem deletar suas próprias mensagens
CREATE POLICY "Users can delete own messages"
ON support_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);