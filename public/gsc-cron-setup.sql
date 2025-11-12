-- =======================================================
-- CONFIGURAÇÃO DE CRON JOBS PARA GOOGLE SEARCH CONSOLE
-- =======================================================
-- Este arquivo contém os comandos SQL para configurar os cron jobs
-- que automatizam o processamento da fila de indexação e verificação
-- de status das URLs no Google Search Console.
--
-- IMPORTANTE: Execute estes comandos através da ferramenta de inserção
-- do Supabase (supabase--insert tool) para configurar a automação.
-- =======================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =======================================================
-- CRON JOB 1: Processar Fila de Indexação
-- =======================================================
-- Executa a cada 6 horas para processar URLs pendentes
-- na fila de indexação do Google Search Console.
-- 
-- Horários de execução: 00:00, 06:00, 12:00, 18:00 UTC
-- =======================================================

SELECT cron.schedule(
  'gsc-process-indexing-queue',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url:='https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-process-indexing-queue',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- =======================================================
-- CRON JOB 2: Verificar Status de Indexação
-- =======================================================
-- Executa diariamente à meia-noite (UTC) para verificar
-- o status real de indexação das URLs submetidas via
-- Google Search Console API.
-- 
-- Horário de execução: 00:00 UTC
-- =======================================================

SELECT cron.schedule(
  'gsc-check-indexation-status',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://jhzmgexprjnpgadkxjup.supabase.co/functions/v1/gsc-check-indexation-status',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoem1nZXhwcmpucGdhZGt4anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTM0MjQsImV4cCI6MjA3NjI4OTQyNH0.D1Rwcr_EC_AXc2O7dem2WgjG-7XiTazG0zTv936ONKM"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- =======================================================
-- COMANDOS DE GERENCIAMENTO (OPCIONAL)
-- =======================================================
-- Use estes comandos para gerenciar os cron jobs após
-- a configuração inicial.
-- =======================================================

-- Ver todos os cron jobs ativos:
-- SELECT * FROM cron.job;

-- Desabilitar um cron job:
-- SELECT cron.unschedule('gsc-process-indexing-queue');
-- SELECT cron.unschedule('gsc-check-indexation-status');

-- Verificar histórico de execução:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- =======================================================
-- NOTAS IMPORTANTES
-- =======================================================
-- 1. Os horários são em UTC. Ajuste conforme sua timezone.
-- 2. O token de autorização é o anon key do projeto.
-- 3. Os jobs executam automaticamente após configuração.
-- 4. Monitore os logs das edge functions para debug.
-- 5. A fila processa até 200 URLs por integração/dia.
-- =======================================================
