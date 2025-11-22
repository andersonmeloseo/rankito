-- ============================================================
-- CRON JOBS PARA MELHORIAS DO SISTEMA DE INDEXAÇÃO GSC
-- ============================================================
--
-- Este arquivo configura 2 novos cron jobs para automação:
-- 1. Processar retries agendados (a cada 2 horas)
-- 2. Sincronizar status real do Google via Inspection API (diariamente)
--
-- INSTRUÇÕES:
-- Execute este SQL no Supabase SQL Editor ou via migration
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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
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
