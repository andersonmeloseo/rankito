-- Fase 2: Limpar fila travada (URLs antigas da Conta 02 unhealthy)
DELETE FROM gsc_indexing_queue
WHERE status = 'pending'
  AND integration_id = '3756839c-d7cc-40ad-bfd0-db71f93dc143'
  AND scheduled_for < '2025-11-16';

-- Fase 3: Remover coluna obsoleta used_integration_id
ALTER TABLE gsc_url_indexing_requests 
DROP COLUMN IF EXISTS used_integration_id;

-- Adicionar comentário explicativo
COMMENT ON COLUMN gsc_url_indexing_requests.integration_id IS 
'ID da integração GSC que criou e processou a requisição';