-- ================================================
-- CONFIGURAÇÃO DE CRON JOBS PARA AGENDAMENTO GSC
-- ================================================
-- Este arquivo contém os comandos SQL para configurar os cron jobs
-- que automatizam o agendamento inteligente e processamento de URLs
-- no Google Search Console.
--
-- IMPORTANTE: Execute estes comandos através da ferramenta de inserção
-- do Supabase (supabase--insert tool) para configurar a automação.
-- ================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ================================================
-- CRON JOB 1: Smart Scheduler (Diário às 00:30 UTC)
-- ================================================
-- Executa diariamente para distribuir URLs descobertas
-- ao longo de 24h respeitando quota de 200/dia por integração.
-- 
-- Horário de execução: 00:30 UTC
-- ================================================

SELECT cron.schedule(
  'gsc-smart-scheduler',
  '30 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-smart-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- ================================================
-- CRON JOB 2: Process Scheduled URLs (A cada 30 min)
-- ================================================
-- Executa a cada 30 minutos para processar URLs cujo
-- horário de agendamento chegou, respeitando quota diária.
-- 
-- Horário de execução: A cada 30 minutos
-- ================================================

SELECT cron.schedule(
  'gsc-process-scheduled-urls',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-process-scheduled-urls',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- ================================================
-- COMANDOS DE GERENCIAMENTO (OPCIONAL)
-- ================================================
-- Use estes comandos para gerenciar os cron jobs após
-- a configuração inicial.
-- ================================================

-- Ver todos os cron jobs ativos:
-- SELECT * FROM cron.job;

-- Desabilitar um cron job:
-- SELECT cron.unschedule('gsc-smart-scheduler');
-- SELECT cron.unschedule('gsc-process-scheduled-urls');

-- Verificar histórico de execução:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Ver logs de execução do sistema:
-- SELECT * FROM gsc_schedule_execution_logs ORDER BY created_at DESC LIMIT 20;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================
-- 1. Os horários são em UTC. Ajuste conforme sua timezone.
-- 2. O scheduler roda 1x/dia e distribui URLs em 48 slots de 30min.
-- 3. O processor roda a cada 30min e processa URLs agendadas.
-- 4. Sistema respeita limite de 200 URLs/dia por integração.
-- 5. URLs excedentes são reagendadas para o próximo dia.
-- 6. Monitore logs via gsc_schedule_execution_logs.
-- ================================================
