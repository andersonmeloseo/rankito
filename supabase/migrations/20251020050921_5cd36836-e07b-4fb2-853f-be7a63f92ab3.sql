-- Adicionar coluna para armazenar HTML renderizado do relatório
ALTER TABLE saved_reports 
ADD COLUMN IF NOT EXISTS report_html TEXT;

-- Criar índice para performance em buscas de relatórios com HTML
CREATE INDEX IF NOT EXISTS idx_saved_reports_html 
ON saved_reports(id) 
WHERE report_html IS NOT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN saved_reports.report_html IS 'HTML renderizado completo do relatório para visualização standalone';