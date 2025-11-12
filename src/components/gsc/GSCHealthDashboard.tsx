import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

interface GSCHealthDashboardProps {
  siteId: string;
}

export function GSCHealthDashboard({ siteId }: GSCHealthDashboardProps) {
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['gsc-health', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      // Buscar integrações ativas
      const { data: integrations, error: intError } = await supabase
        .from('google_search_console_integrations')
        .select('id, connection_name, is_active')
        .eq('site_id', siteId);

      if (intError) throw intError;

      const activeIntegrations = integrations?.filter(i => i.is_active) || [];

      // Buscar estatísticas das últimas 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: recentRequests, error: reqError } = await supabase
        .from('gsc_url_indexing_requests')
        .select('status, google_search_console_integrations!inner(site_id)')
        .eq('google_search_console_integrations.site_id', siteId)
        .gte('submitted_at', twentyFourHoursAgo.toISOString());

      if (reqError) throw reqError;

      const successCount = recentRequests?.filter(r => r.status === 'success').length || 0;
      const errorCount = recentRequests?.filter(r => r.status === 'error').length || 0;
      const totalRequests = recentRequests?.length || 0;
      const successRate = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0;

      // Verificar se há erros recentes de API
      const hasApiErrors = recentRequests?.some(r => 
        r.status === 'error' && 
        // @ts-ignore - gsc_response is JSONB
        (r.gsc_response?.error?.message?.includes('API') || 
         // @ts-ignore
         r.gsc_response?.error?.code === 403)
      ) || false;

      // Buscar quota agregada
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let totalUsed = 0;
      let totalLimit = 0;

      for (const integration of activeIntegrations) {
        const { count } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('integration_id', integration.id)
          .gte('submitted_at', today.toISOString());

        totalUsed += count || 0;
        totalLimit += 200;
      }

      const totalRemaining = totalLimit - totalUsed;

      return {
        activeIntegrations: activeIntegrations.length,
        totalIntegrations: integrations?.length || 0,
        hasApiErrors,
        quota: {
          used: totalUsed,
          limit: totalLimit,
          remaining: totalRemaining,
        },
        last24h: {
          success: successCount,
          errors: errorCount,
          total: totalRequests,
          successRate,
        },
      };
    },
    enabled: !!siteId,
    refetchInterval: 60000, // Refetch a cada 60 segundos
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏥 Status do Sistema GSC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return null;
  }

  const getOverallStatus = () => {
    if (healthData.activeIntegrations === 0) return 'unhealthy';
    if (healthData.hasApiErrors) return 'degraded';
    if (healthData.last24h.successRate < 80) return 'degraded';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className={
      overallStatus === 'healthy' ? 'border-green-500' :
      overallStatus === 'degraded' ? 'border-yellow-500' : 
      'border-red-500'
    }>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🏥 Status do Sistema GSC
              {overallStatus === 'healthy' && <Badge className="bg-green-600">Saudável</Badge>}
              {overallStatus === 'degraded' && <Badge className="bg-yellow-600">Degradado</Badge>}
              {overallStatus === 'unhealthy' && <Badge variant="destructive">Crítico</Badge>}
            </CardTitle>
            <CardDescription>
              Monitoramento da saúde das integrações Google Search Console
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Integrações */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {healthData.activeIntegrations > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">Integrações GSC</p>
              <p className="text-sm text-muted-foreground">
                {healthData.activeIntegrations} ativa(s) de {healthData.totalIntegrations} total
              </p>
            </div>
          </div>
          <Badge variant={healthData.activeIntegrations > 0 ? "outline" : "destructive"}>
            {healthData.activeIntegrations > 0 ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* APIs do Google */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {!healthData.hasApiErrors ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">APIs do Google</p>
              <p className="text-sm text-muted-foreground">
                {!healthData.hasApiErrors ? 
                  "Todas APIs configuradas corretamente" : 
                  "Erros de API detectados"}
              </p>
            </div>
          </div>
          <Badge variant={!healthData.hasApiErrors ? "outline" : "destructive"}>
            {!healthData.hasApiErrors ? "OK" : "Erro"}
          </Badge>
        </div>

        {/* Quota */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {healthData.quota.remaining > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">Quota Disponível</p>
              <p className="text-sm text-muted-foreground">
                {healthData.quota.remaining} de {healthData.quota.limit} URLs restantes hoje
              </p>
            </div>
          </div>
          <Badge variant={healthData.quota.remaining > 0 ? "outline" : "destructive"}>
            {healthData.quota.used}/{healthData.quota.limit}
          </Badge>
        </div>

        {/* Performance últimas 24h */}
        <div className="p-3 rounded-lg border bg-muted/50">
          <p className="font-medium mb-2">📊 Últimas 24 horas:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">URLs indexadas com sucesso:</p>
              <p className="text-lg font-bold text-green-600">{healthData.last24h.success}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Erros:</p>
              <p className="text-lg font-bold text-red-600">{healthData.last24h.errors}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total de requisições:</p>
              <p className="text-lg font-bold">{healthData.last24h.total}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Taxa de sucesso:</p>
              <p className={`text-lg font-bold ${
                healthData.last24h.successRate >= 80 ? 'text-green-600' : 
                healthData.last24h.successRate >= 50 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {healthData.last24h.successRate}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
