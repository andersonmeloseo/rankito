-- Remover política antiga que está bloqueando acesso
DROP POLICY IF EXISTS "Public can view enabled analytics via token" ON client_portal_analytics;

-- Criar nova política que permite acesso público a portais habilitados
CREATE POLICY "Allow public access to enabled portals"
ON client_portal_analytics
FOR SELECT
TO anon, authenticated
USING (enabled = true);

-- Comentário: O token é validado na camada da aplicação (usePortalAuth hook)
-- Esta política permite que qualquer pessoa veja portais que estão enabled=true