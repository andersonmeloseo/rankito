-- Migração: Simplificar status de indexação GSC
-- Renomear 'sent_for_indexing' para 'sent'
UPDATE gsc_discovered_urls 
SET current_status = 'sent' 
WHERE current_status = 'sent_for_indexing';

-- Remover qualquer status 'queued' (se existir), voltando para 'discovered'
UPDATE gsc_discovered_urls 
SET current_status = 'discovered' 
WHERE current_status = 'queued';