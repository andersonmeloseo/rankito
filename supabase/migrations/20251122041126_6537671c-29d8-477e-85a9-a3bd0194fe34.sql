-- Adicionar colunas de session tracking na tabela rank_rent_conversions
ALTER TABLE rank_rent_conversions
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS sequence_number INTEGER,
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

-- Criar índice para melhorar performance de queries por session_id
CREATE INDEX IF NOT EXISTS idx_conversions_session_id ON rank_rent_conversions(session_id);

-- Comentários para documentação
COMMENT ON COLUMN rank_rent_conversions.session_id IS 'ID da sessão de navegação do usuário (timeout 30min)';
COMMENT ON COLUMN rank_rent_conversions.sequence_number IS 'Número sequencial da página visitada dentro da sessão';
COMMENT ON COLUMN rank_rent_conversions.time_spent_seconds IS 'Tempo em segundos que o usuário passou na página';