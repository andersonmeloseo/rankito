-- Adicionar coluna card_color na tabela crm_deals
ALTER TABLE crm_deals 
ADD COLUMN card_color text DEFAULT 'default';