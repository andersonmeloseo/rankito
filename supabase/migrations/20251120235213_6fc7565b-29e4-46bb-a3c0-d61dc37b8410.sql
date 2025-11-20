-- Adicionar policy RLS para permitir usuários visualizarem conversões dos próprios sites
-- independente de role atribuída
CREATE POLICY "Users can view own sites conversions"
ON public.rank_rent_conversions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.rank_rent_sites 
    WHERE rank_rent_sites.id = rank_rent_conversions.site_id 
    AND (
      rank_rent_sites.owner_user_id = auth.uid() 
      OR rank_rent_sites.created_by_user_id = auth.uid()
    )
  )
);