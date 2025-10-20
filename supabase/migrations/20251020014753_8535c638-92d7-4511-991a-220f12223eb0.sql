-- Adicionar policy para end-clients visualizarem seus próprios pagamentos
CREATE POLICY "End clients can view own payments"
  ON rank_rent_payments
  FOR SELECT
  USING (
    has_role(auth.uid(), 'end_client'::app_role) 
    AND client_id IN (
      SELECT c.id 
      FROM rank_rent_clients c
      INNER JOIN rank_rent_sites s ON s.client_id = c.id
      WHERE s.owner_user_id = get_parent_user_id(auth.uid())
    )
  );