-- ============================================================
-- CRON JOB: Consulta Automática de Status do Google (Inspection API)
-- ============================================================
-- Executa gsc-sync-inspection-status automaticamente a cada 6 horas
-- para manter o status do Google atualizado nas URLs descobertas
-- ============================================================

-- Habilitar extensões necessárias (se ainda não habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar job para executar a cada 6 horas
SELECT cron.schedule(
  'gsc-sync-inspection-status-auto',
  '0 */6 * * *', -- A cada 6 horas (00:00, 06:00, 12:00, 18:00 UTC)
  $$
  SELECT net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-sync-inspection-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================================
-- COMANDOS DE GERENCIAMENTO (para referência)
-- ============================================================

-- Ver cron jobs ativos:
-- SELECT * FROM cron.job WHERE jobname = 'gsc-sync-inspection-status-auto';

-- Ver histórico de execuções:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobname = 'gsc-sync-inspection-status-auto'
-- ORDER BY start_time DESC LIMIT 20;

-- Desagendar (se necessário):
-- SELECT cron.unschedule('gsc-sync-inspection-status-auto');