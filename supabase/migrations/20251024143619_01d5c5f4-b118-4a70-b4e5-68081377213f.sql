-- Remover default primeiro
ALTER TABLE external_lead_sources 
  ALTER COLUMN source_type DROP DEFAULT;

-- Remove chrome_extension do tipo enum e adiciona webhook, chatbot
ALTER TYPE external_source_type RENAME TO external_source_type_old;

CREATE TYPE external_source_type AS ENUM ('wordpress', 'webhook', 'chatbot', 'api', 'manual');

-- Converte coluna para text temporariamente
ALTER TABLE external_lead_sources 
  ALTER COLUMN source_type TYPE text 
  USING source_type::text;

-- Substitui chrome_extension por webhook
UPDATE external_lead_sources 
SET source_type = 'webhook'
WHERE source_type = 'chrome_extension';

-- Converte para o novo enum
ALTER TABLE external_lead_sources 
  ALTER COLUMN source_type TYPE external_source_type 
  USING source_type::external_source_type;

-- Remove tipo antigo
DROP TYPE external_source_type_old;

-- Adiciona default de volta se necessário
ALTER TABLE external_lead_sources 
  ALTER COLUMN source_type SET DEFAULT 'webhook'::external_source_type;
