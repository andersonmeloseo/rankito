import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCIndexingAlerts } from "@/hooks/useGSCIndexingAlerts";
import { AlertTriangle, AlertCircle, Info, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCAlertsDashboardProps {
  siteId: string;
}

export function GSCAlertsDashboard({ siteId }: GSCAlertsDashboardProps) {
  const { alerts, isLoading, stats, acknowledgeAlert, isAcknowledging } = useGSCIndexingAlerts({
    siteId,
    includeAcknowledged: false,
  });

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: {
        icon: AlertTriangle,
        className: "border-destructive bg-destructive/10",
        badgeVariant: "destructive" as const,
        iconColor: "text-destructive",
      },
      warning: {
        icon: AlertCircle,
        className: "border-yellow-500 bg-yellow-500/10",
        badgeVariant: "secondary" as const,
        iconColor: "text-yellow-600",
      },
      info: {
        icon: Info,
        className: "border-blue-500 bg-blue-500/10",
        badgeVariant: "outline" as const,
        iconColor: "text-blue-600",
      },
    };

    return configs[severity as keyof typeof configs] || configs.info;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Indexação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alertas de Indexação</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.unacknowledged} alertas pendentes
              {stats.critical > 0 && (
                <span className="text-destructive font-medium ml-2">
                  • {stats.critical} críticos
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="destructive">{stats.critical}</Badge>
            <Badge variant="secondary">{stats.warning}</Badge>
            <Badge variant="outline">{stats.info}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum alerta pendente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas integrações GSC estão funcionando corretamente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const config = getSeverityConfig(alert.severity);
              const Icon = config.icon;

              return (
                <Alert key={alert.id} className={config.className}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <AlertTitle className="mb-1">{alert.title}</AlertTitle>
                          <AlertDescription className="text-sm">
                            {alert.message}
                          </AlertDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          disabled={isAcknowledging}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {alert.suggestion && (
                        <div className="bg-background/50 border border-border/50 rounded-md p-3 text-sm">
                          <strong className="text-foreground">💡 Sugestão:</strong>
                          <p className="text-muted-foreground mt-1">{alert.suggestion}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(alert.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <Badge variant={config.badgeVariant} className="text-xs">
                          {alert.alert_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Alert>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
