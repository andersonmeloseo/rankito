import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCAggregatedQuota } from "@/hooks/useGSCAggregatedQuota";
import { Zap, TrendingUp, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { formatNumber } from "@/lib/gsc-chart-utils";

interface GSCAggregatedQuotaCardProps {
  siteId: string;
}

export function GSCAggregatedQuotaCard({ siteId }: GSCAggregatedQuotaCardProps) {
  const { data: quota, isLoading } = useGSCAggregatedQuota(siteId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quota Agregada GSC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!quota || quota.active_integrations_count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quota Agregada GSC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Adicione integrações GSC para ver a quota agregada
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUsageColor = () => {
    if (quota.usage_percentage >= 90) return "text-red-600";
    if (quota.usage_percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (quota.usage_percentage >= 90) return "bg-red-600";
    if (quota.usage_percentage >= 70) return "bg-yellow-600";
    return "bg-green-600";
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quota Agregada GSC
            </CardTitle>
            <CardDescription className="mt-1">
              Capacidade total de {quota.active_integrations_count} integraç{quota.active_integrations_count === 1 ? 'ão' : 'ões'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {quota.healthy_integrations_count === quota.active_integrations_count ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Todas operacionais
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {quota.healthy_integrations_count}/{quota.active_integrations_count} operacionais
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Capacidade Total Diária */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Capacidade Diária Total</p>
              <p className="text-3xl font-bold">{formatNumber(quota.total_daily_limit)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {quota.active_integrations_count} conta{quota.active_integrations_count === 1 ? '' : 's'} × 200 URLs/dia
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Usado Hoje</p>
              <p className={`text-2xl font-bold ${getUsageColor()}`}>
                {formatNumber(quota.total_used_today)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {quota.usage_percentage.toFixed(1)}% utilizado
              </p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <Progress 
              value={quota.usage_percentage} 
              className={`h-3 ${getProgressColor()}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span className="font-medium">
                {formatNumber(quota.total_remaining)} URLs restantes
              </span>
              <span>{formatNumber(quota.total_daily_limit)}</span>
            </div>
          </div>
        </div>

        {/* Capacidade Estimada */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Disponível Agora</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(quota.estimated_capacity_today)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              URLs que podem ser enviadas hoje
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Contas Ativas</span>
            </div>
            <p className="text-2xl font-bold">
              {quota.healthy_integrations_count}/{quota.active_integrations_count}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Integrações operacionais
            </p>
          </div>
        </div>

        {/* Status das Integrações */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Distribuição por Conta</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {quota.integrations
              .filter(i => i.is_active)
              .sort((a, b) => b.remaining_today - a.remaining_today)
              .map((integration) => {
                const usagePercent = (integration.used_today / integration.daily_limit) * 100;
                const isAvailable = integration.health_status === 'healthy' || integration.health_status === null;
                
                return (
                  <div 
                    key={integration.integration_id} 
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div 
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`} 
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{integration.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{integration.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge 
                        variant={usagePercent >= 90 ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {integration.used_today}/{integration.daily_limit}
                      </Badge>
                      {!isAvailable && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                          Indisponível
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
