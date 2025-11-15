-- Função para resetar status de integrações unhealthy automaticamente
CREATE OR REPLACE FUNCTION reset_gsc_integration_health()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Resetar integrações unhealthy cujo cooldown expirou
  UPDATE google_search_console_integrations
  SET 
    health_status = 'healthy',
    last_error = NULL,
    health_check_at = NULL,
    consecutive_failures = 0
  WHERE health_status = 'unhealthy'
    AND (
      health_check_at IS NULL 
      OR health_check_at < NOW()
    );
END;
$$;

-- Agendar execução diária às 00:00 UTC via pg_cron
-- Nota: Isso será complementado por verificação no edge function também
COMMENT ON FUNCTION reset_gsc_integration_health() IS 'Reseta automaticamente o status de integrações GSC marcadas como unhealthy após cooldown expirar. Executado diariamente às 00:00 UTC.';