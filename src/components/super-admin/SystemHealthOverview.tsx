import { Activity, Zap, Globe, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemHealthOverviewProps {
  metrics: {
    overview: {
      overallStatus: 'healthy' | 'warning' | 'critical';
      healthScore: number;
      activeServices: number;
      servicesWithIssues: number;
    };
    edgeFunctions: {
      totalExecutions: number;
      successRate: number;
      recentFailures: any[];
    };
    gscIntegrations: {
      totalActive: number;
      healthy: number;
      unhealthy: number;
    };
    geolocationApis: {
      totalActive: number;
      totalWithErrors: number;
    };
  };
}

export const SystemHealthOverview = ({ metrics }: SystemHealthOverviewProps) => {
  const { overview, edgeFunctions, gscIntegrations, geolocationApis } = metrics;

  const statusConfig = {
    healthy: {
      color: "bg-green-500/10 border-green-500",
      badge: "default",
      icon: CheckCircle2,
      iconColor: "text-green-500",
      label: "Sistema Saudável",
    },
    warning: {
      color: "bg-yellow-500/10 border-yellow-500",
      badge: "warning",
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
      label: "Atenção Necessária",
    },
    critical: {
      color: "bg-red-500/10 border-red-500",
      badge: "destructive",
      icon: XCircle,
      iconColor: "text-red-500",
      label: "Intervenção Crítica",
    },
  };

  const config = statusConfig[overview.overallStatus];
  const StatusIcon = config.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall System Status */}
      <Card className={`shadow-card hover:shadow-lg transition-all duration-200 ${config.color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-8 w-8 ${config.iconColor}`} />
            <div>
              <div className="text-3xl font-bold">
                {overview.healthScore}/100
              </div>
              <Badge variant={config.badge as any} className="mt-1">
                {config.label}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {overview.servicesWithIssues > 0 ? (
              <span className="text-destructive font-medium">
                {overview.servicesWithIssues} serviço(s) com problemas
              </span>
            ) : (
              <span className="text-green-600 font-medium">
                Todos os serviços operacionais
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edge Functions */}
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Zap className="h-4 w-4" />
            Edge Functions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">
                {edgeFunctions.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                taxa de sucesso
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {edgeFunctions.totalExecutions} execuções (24h)
            </div>
            {edgeFunctions.recentFailures.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                {edgeFunctions.recentFailures.length} falhas recentes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GSC Integrations */}
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4" />
            GSC Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-green-600">
                {gscIntegrations.healthy}
              </div>
              <div className="text-xs text-muted-foreground">
                de {gscIntegrations.totalActive} saudáveis
              </div>
            </div>
            {gscIntegrations.unhealthy > 0 && (
              <Badge variant="destructive" className="mt-2">
                {gscIntegrations.unhealthy} com problemas
              </Badge>
            )}
            {gscIntegrations.unhealthy === 0 && (
              <div className="text-xs text-green-600 font-medium mt-2">
                Todas integrações operacionais
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Geolocation APIs */}
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4" />
            Geolocation APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">
                {geolocationApis.totalActive - geolocationApis.totalWithErrors}
              </div>
              <div className="text-xs text-muted-foreground">
                de {geolocationApis.totalActive} operacionais
              </div>
            </div>
            {geolocationApis.totalWithErrors > 0 && (
              <Badge variant="warning" className="mt-2">
                {geolocationApis.totalWithErrors} com erros
              </Badge>
            )}
            {geolocationApis.totalWithErrors === 0 && (
              <div className="text-xs text-green-600 font-medium mt-2">
                Todas APIs operacionais
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
