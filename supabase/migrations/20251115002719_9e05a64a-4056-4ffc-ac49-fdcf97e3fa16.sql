-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela para armazenar submissões IndexNow
CREATE TABLE IF NOT EXISTS indexnow_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados da submissão
  urls_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  status_code INTEGER,
  response_data TEXT,
  request_payload JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_indexnow_submissions_site_id ON indexnow_submissions(site_id);
CREATE INDEX idx_indexnow_submissions_user_id ON indexnow_submissions(user_id);
CREATE INDEX idx_indexnow_submissions_created_at ON indexnow_submissions(created_at DESC);

-- RLS Policies
ALTER TABLE indexnow_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own indexnow submissions"
  ON indexnow_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own indexnow submissions"
  ON indexnow_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER set_indexnow_submissions_updated_at
  BEFORE UPDATE ON indexnow_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();