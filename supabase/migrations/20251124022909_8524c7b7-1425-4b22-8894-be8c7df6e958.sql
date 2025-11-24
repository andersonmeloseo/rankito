-- Adicionar políticas RLS para permitir clientes e end_clients acessarem URLs descobertas

-- Política para clientes de sites alugados
CREATE POLICY "Clients can view discovered URLs from rented sites"
ON gsc_discovered_urls FOR SELECT
TO public
USING (
  site_id IN (
    SELECT s.id 
    FROM rank_rent_sites s
    INNER JOIN rank_rent_clients rc ON rc.id = s.client_id
    WHERE s.is_rented = true 
      AND rc.user_id = auth.uid()
  )
);

-- Política para end_clients
CREATE POLICY "End clients can view discovered URLs from accessible sites"
ON gsc_discovered_urls FOR SELECT
TO public
USING (
  site_id IN (
    SELECT s.id 
    FROM rank_rent_sites s
    INNER JOIN rank_rent_clients rc ON rc.id = s.client_id
    WHERE s.is_rented = true 
      AND rc.end_client_user_id = auth.uid()
  )
);

-- Política para portais ativos (acesso público)
CREATE POLICY "Public can view discovered URLs for active portals"
ON gsc_discovered_urls FOR SELECT
TO public
USING (
  site_id IN (
    SELECT s.id
    FROM rank_rent_sites s
    INNER JOIN client_portal_analytics cpa ON cpa.client_id = s.client_id
    WHERE cpa.enabled = true
  )
);