-- Permitir usuários atualizarem status de seus próprios tickets
CREATE POLICY "Users can update own tickets status"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());