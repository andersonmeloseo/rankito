-- Adicionar coluna client_id à tabela saved_reports para vincular relatórios aos clientes
ALTER TABLE public.saved_reports
ADD COLUMN client_id uuid REFERENCES public.rank_rent_clients(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance de busca por cliente
CREATE INDEX idx_saved_reports_client_id ON public.saved_reports(client_id);

-- Atualizar RLS: permitir que end clients vejam relatórios compartilhados com eles
CREATE POLICY "End clients can view shared reports"
ON public.saved_reports
FOR SELECT
USING (
  client_id IS NOT NULL 
  AND client_id IN (
    SELECT id FROM rank_rent_clients WHERE id = client_id
  )
);

-- Permitir acesso público aos relatórios compartilhados via portal
CREATE POLICY "Public can view reports for active portals"
ON public.saved_reports
FOR SELECT
USING (
  client_id IN (
    SELECT client_id 
    FROM client_portal_analytics 
    WHERE enabled = true
  )
);