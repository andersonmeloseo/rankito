-- Atualizar constraint para incluir 'sent' como status válido
ALTER TABLE gsc_discovered_urls 
DROP CONSTRAINT gsc_discovered_urls_current_status_check;

ALTER TABLE gsc_discovered_urls 
ADD CONSTRAINT gsc_discovered_urls_current_status_check 
CHECK (current_status = ANY (ARRAY['discovered'::text, 'sent'::text, 'queued'::text, 'indexed'::text, 'failed'::text]));