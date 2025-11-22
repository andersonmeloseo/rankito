-- ============================================================
-- CRON JOBS PARA MELHORIAS DO SISTEMA DE INDEXAÇÃO GSC
-- ============================================================
--
-- Este arquivo configura 2 novos cron jobs para automação:
-- 1. Processar retries agendados (a cada 2 horas)
-- 2. Sincronizar status real do Google via Inspection API (diariamente)
--
-- INSTRUÇÕES:
-- Execute este SQL no Supabase SQL Editor
-- IMPORTANTE: Substitua o Authorization header pelo seu service_role_key
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- CRON JOB 1: Processar Retries Agendados
-- Executa a cada 2 horas para reprocessar URLs que falharam
-- ============================================================

SELECT cron.schedule(
  'gsc-process-retries',
  '0 */2 * * *', -- A cada 2 horas
  $$
  SELECT net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-process-retries',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- CRON JOB 2: Sincronizar Status Real do Google
-- Executa diariamente às 03:00 UTC para consultar Inspection API
-- ============================================================

SELECT cron.schedule(
  'gsc-sync-inspection-status',
  '0 3 * * *', -- Diariamente às 03:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-sync-inspection-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- COMANDOS DE GERENCIAMENTO (opcional)
-- ============================================================

-- Ver todos os cron jobs ativos:
-- SELECT * FROM cron.job;

-- Desagendar um job específico:
-- SELECT cron.unschedule('gsc-process-retries');
-- SELECT cron.unschedule('gsc-sync-inspection-status');

-- Ver histórico de execuções:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobname IN ('gsc-process-retries', 'gsc-sync-inspection-status')
-- ORDER BY start_time DESC 
-- LIMIT 20;
