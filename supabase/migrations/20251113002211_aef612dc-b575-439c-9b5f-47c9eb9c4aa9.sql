-- Create table for GSC queue execution logs
CREATE TABLE IF NOT EXISTS gsc_queue_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_processed INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('cron', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_gsc_queue_logs_executed_at ON gsc_queue_execution_logs(executed_at DESC);

-- Enable RLS
ALTER TABLE gsc_queue_execution_logs ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view logs
CREATE POLICY "Users can view execution logs"
  ON gsc_queue_execution_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only edge functions can insert logs
CREATE POLICY "Edge functions can insert logs"
  ON gsc_queue_execution_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;