-- Tabela de fila de indexação
CREATE TABLE gsc_indexing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  page_id UUID REFERENCES rank_rent_pages(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_for DATE NOT NULL DEFAULT CURRENT_DATE,
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT unique_queue_url_per_integration UNIQUE (integration_id, url, scheduled_for)
);

-- Tabela de batches de indexação
CREATE TABLE gsc_indexing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES google_search_console_integrations(id) ON DELETE CASCADE,
  total_urls INTEGER NOT NULL DEFAULT 0,
  completed_urls INTEGER NOT NULL DEFAULT 0,
  failed_urls INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_gsc_queue_integration_status ON gsc_indexing_queue(integration_id, status);
CREATE INDEX idx_gsc_queue_scheduled_for ON gsc_indexing_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_gsc_queue_batch_id ON gsc_indexing_queue(batch_id);
CREATE INDEX idx_gsc_batches_integration ON gsc_indexing_batches(integration_id, status);

-- RLS policies para gsc_indexing_queue
ALTER TABLE gsc_indexing_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue items"
  ON gsc_indexing_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE google_search_console_integrations.id = gsc_indexing_queue.integration_id
        AND google_search_console_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own queue items"
  ON gsc_indexing_queue FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE google_search_console_integrations.id = gsc_indexing_queue.integration_id
        AND google_search_console_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own queue items"
  ON gsc_indexing_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE google_search_console_integrations.id = gsc_indexing_queue.integration_id
        AND google_search_console_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Edge functions can process queue"
  ON gsc_indexing_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies para gsc_indexing_batches
ALTER TABLE gsc_indexing_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batches"
  ON gsc_indexing_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE google_search_console_integrations.id = gsc_indexing_batches.integration_id
        AND google_search_console_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own batches"
  ON gsc_indexing_batches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE google_search_console_integrations.id = gsc_indexing_batches.integration_id
        AND google_search_console_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own batches"
  ON gsc_indexing_batches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM google_search_console_integrations
      WHERE google_search_console_integrations.id = gsc_indexing_batches.integration_id
        AND google_search_console_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Edge functions can process batches"
  ON gsc_indexing_batches FOR ALL
  USING (true)
  WITH CHECK (true);