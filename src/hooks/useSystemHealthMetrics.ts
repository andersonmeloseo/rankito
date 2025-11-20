import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subHours } from "date-fns";

interface SystemHealthMetrics {
  overview: {
    overallStatus: 'healthy' | 'warning' | 'critical';
    healthScore: number;
    activeServices: number;
    servicesWithIssues: number;
  };
  edgeFunctions: {
    totalExecutions: number;
    successRate: number;
    avgExecutionTime: number;
    recentFailures: Array<{
      executionType: string;
      errors: any;
      timestamp: string;
    }>;
  };
  gscIntegrations: {
    totalActive: number;
    healthy: number;
    unhealthy: number;
    unresolvedAlerts: number;
    problematicIntegrations: Array<{
      siteId: string;
      siteName: string;
      connectionName: string;
      healthStatus: string;
      consecutiveFailures: number;
      lastError: string;
    }>;
  };
  geolocationApis: {
    totalActive: number;
    totalWithErrors: number;
    avgErrorRate: number;
    providers: Record<string, {
      active: number;
      errors: number;
    }>;
  };
  recentIssues: Array<{
    type: 'gsc_alert' | 'edge_function' | 'geo_api' | 'system_error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
  databaseMetrics: {
    totalTables: number;
    totalActiveUsers: number;
    totalSites: number;
    conversionsLast24h: number;
    databaseSize: string;
  };
}

export const useSystemHealthMetrics = () => {
  return useQuery({
    queryKey: ['system-health-metrics'],
    queryFn: async (): Promise<SystemHealthMetrics> => {
      const last24Hours = subHours(new Date(), 24).toISOString();

      // Fetch all data in parallel
      const [
        edgeLogsResult,
        gscIntegrationsResult,
        gscAlertsResult,
        geoApisResult,
        dbMetricsResult,
        sitesResult,
      ] = await Promise.all([
        // Edge Function logs
        supabase
          .from('gsc_schedule_execution_logs')
          .select('*')
          .gte('created_at', last24Hours)
          .order('created_at', { ascending: false })
          .limit(100),
        
        // GSC Integrations
        supabase
          .from('google_search_console_integrations')
          .select('health_status, consecutive_failures, last_error, is_active, site_id, connection_name')
          .eq('is_active', true),
        
        // GSC Alerts (unresolved)
        supabase
          .from('gsc_indexing_alerts')
          .select('severity, alert_type, message, created_at, site_id')
          .is('resolved_at', null)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Geolocation APIs
        supabase
          .from('geolocation_api_configs')
          .select('provider_name, is_active, error_count, usage_count, last_error')
          .eq('is_active', true),
        
        // Database metrics
        supabase.rpc('get_database_health_metrics'),
        
        // Sites for mapping
        supabase
          .from('rank_rent_sites')
          .select('id, site_name'),
      ]);

      const edgeLogs = edgeLogsResult.data || [];
      const gscIntegrations = gscIntegrationsResult.data || [];
      const gscAlerts = gscAlertsResult.data || [];
      const geoApis = geoApisResult.data || [];
      const dbMetrics = dbMetricsResult.data || {};
      const sites = sitesResult.data || [];

      // Create site map for quick lookup
      const siteMap = new Map(sites.map(s => [s.id, s.site_name]));

      // Calculate Edge Functions metrics
      const totalExecutions = edgeLogs.length;
      const failedExecutions = edgeLogs.filter(log => log.errors && Object.keys(log.errors).length > 0);
      const successRate = totalExecutions > 0 ? ((totalExecutions - failedExecutions.length) / totalExecutions) * 100 : 100;
      const avgExecutionTime = edgeLogs.length > 0
        ? edgeLogs.reduce((sum, log) => sum + (log.execution_duration_ms || 0), 0) / edgeLogs.length
        : 0;

      const recentFailures = failedExecutions.slice(0, 10).map(log => ({
        executionType: log.execution_type,
        errors: log.errors,
        timestamp: log.created_at,
      }));

      // Calculate GSC Integrations metrics
      const healthyIntegrations = gscIntegrations.filter(i => i.health_status === 'healthy' || !i.health_status);
      const unhealthyIntegrations = gscIntegrations.filter(i => i.health_status === 'unhealthy');
      
      const problematicIntegrations = unhealthyIntegrations.map(i => ({
        siteId: i.site_id,
        siteName: siteMap.get(i.site_id) || 'Site desconhecido',
        connectionName: i.connection_name,
        healthStatus: i.health_status || 'unknown',
        consecutiveFailures: i.consecutive_failures || 0,
        lastError: i.last_error || 'Sem detalhes',
      }));

      // Calculate Geolocation APIs metrics
      const totalWithErrors = geoApis.filter(api => (api.error_count || 0) > 0).length;
      const avgErrorRate = geoApis.length > 0
        ? (geoApis.reduce((sum, api) => sum + (api.error_count || 0), 0) / geoApis.length)
        : 0;

      const providers: Record<string, { active: number; errors: number }> = {};
      geoApis.forEach(api => {
        if (!providers[api.provider_name]) {
          providers[api.provider_name] = { active: 0, errors: 0 };
        }
        providers[api.provider_name].active += 1;
        if ((api.error_count || 0) > 0) {
          providers[api.provider_name].errors += 1;
        }
      });

      // Aggregate recent issues
      const recentIssues: SystemHealthMetrics['recentIssues'] = [];

      // Add GSC alerts
      gscAlerts.forEach(alert => {
        recentIssues.push({
          type: 'gsc_alert',
          severity: alert.severity === 'critical' ? 'critical' : alert.severity === 'error' ? 'high' : alert.severity === 'warning' ? 'medium' : 'low',
          message: `[${alert.alert_type}] ${alert.message}`,
          timestamp: alert.created_at,
        });
      });

      // Add edge function failures
      failedExecutions.slice(0, 20).forEach(log => {
        recentIssues.push({
          type: 'edge_function',
          severity: 'medium',
          message: `Edge Function ${log.execution_type} falhou`,
          timestamp: log.created_at,
        });
      });

      // Add geo API errors
      geoApis.filter(api => api.last_error).forEach(api => {
        recentIssues.push({
          type: 'geo_api',
          severity: (api.error_count || 0) > 10 ? 'high' : 'medium',
          message: `${api.provider_name}: ${api.last_error}`,
          timestamp: new Date().toISOString(),
        });
      });

      // Sort by timestamp (most recent first)
      recentIssues.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate overall health score and status
      const servicesWithIssues = unhealthyIntegrations.length + totalWithErrors + failedExecutions.length;
      const activeServices = gscIntegrations.length + geoApis.length + 1; // +1 for edge functions
      
      let healthScore = 100;
      if (unhealthyIntegrations.length > 0) healthScore -= unhealthyIntegrations.length * 10;
      if (totalWithErrors > 0) healthScore -= totalWithErrors * 5;
      if (successRate < 90) healthScore -= (100 - successRate);
      healthScore = Math.max(0, Math.min(100, healthScore));

      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (healthScore < 50) overallStatus = 'critical';
      else if (healthScore < 80) overallStatus = 'warning';

      return {
        overview: {
          overallStatus,
          healthScore: Math.round(healthScore),
          activeServices,
          servicesWithIssues,
        },
        edgeFunctions: {
          totalExecutions,
          successRate: Math.round(successRate * 10) / 10,
          avgExecutionTime: Math.round(avgExecutionTime),
          recentFailures,
        },
        gscIntegrations: {
          totalActive: gscIntegrations.length,
          healthy: healthyIntegrations.length,
          unhealthy: unhealthyIntegrations.length,
          unresolvedAlerts: gscAlerts.length,
          problematicIntegrations,
        },
        geolocationApis: {
          totalActive: geoApis.length,
          totalWithErrors,
          avgErrorRate: Math.round(avgErrorRate * 10) / 10,
          providers,
        },
        recentIssues: recentIssues.slice(0, 50),
        databaseMetrics: {
          totalTables: (dbMetrics as any)?.total_tables || 0,
          totalActiveUsers: (dbMetrics as any)?.total_active_users || 0,
          totalSites: (dbMetrics as any)?.total_sites || 0,
          conversionsLast24h: (dbMetrics as any)?.conversions_last_24h || 0,
          databaseSize: (dbMetrics as any)?.database_size || '0 MB',
        },
      };
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    staleTime: 1 * 60 * 1000, // Cache valid for 1 minute
  });
};
