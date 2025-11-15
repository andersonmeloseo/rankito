import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay } from 'date-fns';

interface IntegrationQuota {
  integration_id: string;
  name: string;
  email: string;
  is_active: boolean;
  health_status: 'healthy' | 'unhealthy' | 'checking' | null;
  daily_limit: number;
  used_today: number;
  remaining_today: number;
  success_rate: number;
}

interface AggregatedQuota {
  total_daily_limit: number;
  total_used_today: number;
  total_remaining: number;
  usage_percentage: number;
  active_integrations_count: number;
  healthy_integrations_count: number;
  integrations: IntegrationQuota[];
  can_accept_more: boolean;
  estimated_capacity_today: number;
}

export function useGSCAggregatedQuota(siteId: string | null) {
  return useQuery({
    queryKey: ['gsc-aggregated-quota', siteId],
    queryFn: async (): Promise<AggregatedQuota | null> => {
      if (!siteId) return null;

      const today = startOfDay(new Date());
      const DAILY_LIMIT_PER_INTEGRATION = 200;

      // Buscar todas as integrações do site
      const { data: integrations, error: integrationsError } = await supabase
        .from('google_search_console_integrations')
        .select('id, connection_name, google_email, is_active, health_status')
        .eq('site_id', siteId);

      if (integrationsError || !integrations) {
        console.error('❌ Erro ao buscar integrações:', integrationsError);
        return null;
      }

      // Para cada integração, calcular uso de hoje
      const quotaPromises = integrations.map(async (integration) => {
        // Contar requisições com sucesso hoje
        const { count: successCount } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('used_integration_id', integration.id)
          .eq('status', 'success')
          .gte('created_at', today.toISOString());

        // Contar total de requisições hoje (para taxa de sucesso)
        const { count: totalCount } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('used_integration_id', integration.id)
          .gte('created_at', today.toISOString());

        const used = successCount || 0;
        const total = totalCount || 0;
        const remaining = DAILY_LIMIT_PER_INTEGRATION - used;
        const success_rate = total > 0 ? (used / total) * 100 : 100;

        return {
          integration_id: integration.id,
          name: integration.connection_name,
          email: integration.google_email || '',
          is_active: integration.is_active || false,
          health_status: integration.health_status as 'healthy' | 'unhealthy' | 'checking' | null,
          daily_limit: DAILY_LIMIT_PER_INTEGRATION,
          used_today: used,
          remaining_today: Math.max(0, remaining),
          success_rate,
        };
      });

      const quotaData = await Promise.all(quotaPromises);

      // Calcular totais agregados
      const activeIntegrations = quotaData.filter(i => i.is_active);
      const healthyIntegrations = activeIntegrations.filter(
        i => i.health_status === 'healthy' || i.health_status === null
      );

      const total_daily_limit = activeIntegrations.length * DAILY_LIMIT_PER_INTEGRATION;
      const total_used_today = quotaData.reduce((sum, i) => sum + i.used_today, 0);
      const total_remaining = Math.max(0, total_daily_limit - total_used_today);
      const usage_percentage = total_daily_limit > 0 
        ? (total_used_today / total_daily_limit) * 100 
        : 0;

      // Estimar capacidade restante hoje (apenas contas saudáveis)
      const healthy_remaining = healthyIntegrations.reduce(
        (sum, i) => sum + i.remaining_today, 
        0
      );

      return {
        total_daily_limit,
        total_used_today,
        total_remaining,
        usage_percentage,
        active_integrations_count: activeIntegrations.length,
        healthy_integrations_count: healthyIntegrations.length,
        integrations: quotaData,
        can_accept_more: healthy_remaining > 0,
        estimated_capacity_today: healthy_remaining,
      };
    },
    enabled: !!siteId,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
