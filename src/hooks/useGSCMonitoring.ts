import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuotaHistoryEntry {
  date: string;
  used: number;
  limit: number;
}

interface Alert {
  id: string;
  type: 'quota' | 'integration' | 'sitemap' | 'indexing';
  severity: 'info' | 'warning' | 'error';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AggregatedStats {
  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  totalSitemaps: number;
  totalUrlsSubmitted: number;
  totalUrlsIndexed: number;
  totalErrors: number;
  totalWarnings: number;
  quotaUsed: number;
  quotaLimit: number;
  quotaPercentage: number;
  quotaResetIn: string;
  quotaHistory: QuotaHistoryEntry[];
  alerts: Alert[];
}

export function useGSCMonitoring({ siteId, userId }: { siteId: string; userId: string }) {
  const { data: aggregatedStats, isLoading, refetch } = useQuery({
    queryKey: ['gsc-monitoring', siteId],
    queryFn: async () => {
      // Buscar integrações do site
      const { data: integrations } = await supabase
        .from('google_search_console_integrations')
        .select('*')
        .eq('site_id', siteId)
        .eq('user_id', userId);

      const activeIntegrationsCount = integrations?.filter(i => i.is_active).length || 0;
      const aggregatedLimit = activeIntegrationsCount * 200; // 200 URLs/dia por integração

      const stats: AggregatedStats = {
        totalIntegrations: integrations?.length || 0,
        activeIntegrations: activeIntegrationsCount,
        inactiveIntegrations: integrations?.filter(i => !i.is_active).length || 0,
        totalSitemaps: 0,
        totalUrlsSubmitted: 0,
        totalUrlsIndexed: 0,
        totalErrors: 0,
        totalWarnings: 0,
        quotaUsed: 0,
        quotaLimit: aggregatedLimit,
        quotaPercentage: 0,
        quotaResetIn: '',
        quotaHistory: [],
        alerts: [],
      };

      if (!integrations || integrations.length === 0) {
        return stats;
      }

      // Para cada integração ativa, buscar sitemaps
      for (const integration of integrations.filter(i => i.is_active)) {
        try {
          // Buscar sitemaps
          const { data: sitemaps } = await supabase
            .from('gsc_sitemap_submissions')
            .select('*')
            .eq('integration_id', integration.id);

          if (sitemaps) {
            stats.totalSitemaps += sitemaps.length;
            stats.totalUrlsSubmitted += sitemaps.reduce(
              (sum, s) => sum + (s.urls_submitted || 0), 0
            );
            stats.totalUrlsIndexed += sitemaps.reduce(
              (sum, s) => sum + (s.urls_indexed || 0), 0
            );
            stats.totalErrors += sitemaps.reduce(
              (sum, s) => sum + (s.gsc_errors_count || 0), 0
            );
            stats.totalWarnings += sitemaps.reduce(
              (sum, s) => sum + (s.gsc_warnings_count || 0), 0
            );
          }

          // Buscar quota de hoje
          const today = new Date().toISOString().split('T')[0];
          const { data: todayRequests } = await supabase
            .from('gsc_url_indexing_requests')
            .select('id')
            .eq('integration_id', integration.id)
            .gte('created_at', today);

          if (todayRequests) {
            stats.quotaUsed += todayRequests.length;
          }
        } catch (error) {
          console.error('Error fetching data for integration:', integration.id, error);
        }
      }

      stats.quotaPercentage = (stats.quotaUsed / stats.quotaLimit) * 100;

      // Calcular tempo até reset (00:00 UTC)
      const now = new Date();
      const resetTime = new Date(now);
      resetTime.setUTCHours(24, 0, 0, 0);
      const hoursUntilReset = Math.floor((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      stats.quotaResetIn = `${hoursUntilReset}h`;

      // Buscar histórico de quota dos últimos 7 dias
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      for (const date of last7Days) {
        let dailyUsed = 0;
        for (const integration of integrations.filter(i => i.is_active)) {
          const { data: requests } = await supabase
            .from('gsc_url_indexing_requests')
            .select('id')
            .eq('integration_id', integration.id)
            .gte('created_at', date)
            .lt('created_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString());

          if (requests) {
            dailyUsed += requests.length;
          }
        }
        stats.quotaHistory.push({
          date,
          used: dailyUsed,
          limit: aggregatedLimit, // Usa o limite agregado dinâmico
        });
      }

      // Gerar alertas
      if (stats.quotaPercentage >= 100) {
        stats.alerts.push({
          id: 'quota-exceeded',
          type: 'quota',
          severity: 'error',
          message: `Quota diária de indexação esgotada (${stats.quotaUsed}/${stats.quotaLimit} URLs). Reset em ${stats.quotaResetIn}.`,
        });
      } else if (stats.quotaPercentage >= 80) {
        stats.alerts.push({
          id: 'quota-warning',
          type: 'quota',
          severity: 'warning',
          message: `Você usou ${stats.quotaPercentage.toFixed(0)}% da quota diária de indexação (${stats.quotaUsed}/${stats.quotaLimit} URLs).`,
        });
      }

      if (stats.inactiveIntegrations > 0) {
        stats.alerts.push({
          id: 'inactive-integrations',
          type: 'integration',
          severity: 'warning',
          message: `${stats.inactiveIntegrations} integração(ões) desconectada(s). Reconecte para continuar usando o GSC.`,
        });
      }

      if (stats.totalErrors > 0) {
        stats.alerts.push({
          id: 'sitemap-errors',
          type: 'sitemap',
          severity: 'error',
          message: `${stats.totalErrors} erro(s) encontrado(s) nos sitemaps. Verifique a aba Sitemaps para mais detalhes.`,
        });
      }

      return stats;
    },
    enabled: !!siteId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30000, // 30 segundos
  });

  return {
    aggregatedStats,
    isLoading,
    refetch,
  };
}
