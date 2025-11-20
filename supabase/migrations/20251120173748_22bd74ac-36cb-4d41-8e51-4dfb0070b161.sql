-- Adicionar campo para rastrear validação do IndexNow
ALTER TABLE rank_rent_sites 
ADD COLUMN indexnow_validated boolean DEFAULT false;