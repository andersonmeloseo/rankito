-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Clients can view own discovered URLs" ON gsc_discovered_urls;
DROP POLICY IF EXISTS "Clients can manage own discovered URLs" ON gsc_discovered_urls;
DROP POLICY IF EXISTS "Super admins can manage all discovered URLs" ON gsc_discovered_urls;

-- Criar política simplificada para visualização
CREATE POLICY "Users can view own site discovered URLs"
ON gsc_discovered_urls FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_discovered_urls.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

-- Criar política simplificada para gerenciamento
CREATE POLICY "Users can manage own site discovered URLs"
ON gsc_discovered_urls FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = gsc_discovered_urls.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

-- Recriar acesso total para super admins
CREATE POLICY "Super admins can manage all discovered URLs"
ON gsc_discovered_urls FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));