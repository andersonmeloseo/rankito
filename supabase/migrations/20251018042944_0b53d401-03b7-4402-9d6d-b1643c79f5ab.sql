-- Adicionar coluna client_id na tabela rank_rent_sites para vincular cliente ao site
ALTER TABLE rank_rent_sites 
ADD COLUMN client_id UUID REFERENCES rank_rent_clients(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_rank_rent_sites_client_id ON rank_rent_sites(client_id);

-- Comentário: A coluna client_id permite vincular um site a um cliente específico
-- ON DELETE SET NULL garante que se o cliente for deletado, o site não será deletado
-- mas apenas desvinculado (client_id = NULL)