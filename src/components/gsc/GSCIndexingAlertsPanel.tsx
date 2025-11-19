import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGSCIndexingAlerts } from '@/hooks/useGSCIndexingAlerts';
import { AlertTriangle, AlertCircle, Info, XCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface GSCIndexingAlertsPanelProps {
  siteId: string;
}

export const GSCIndexingAlertsPanel = ({ siteId }: GSCIndexingAlertsPanelProps) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolvedFilter, setResolvedFilter] = useState<boolean>(false);

  const { alerts, counts, isLoading, resolveAlert } = useGSCIndexingAlerts(siteId, {
    severity: severityFilter,
    resolved: resolvedFilter,
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Crítico</Badge>;
      case 'error':
        return <Badge className="bg-orange-100 text-orange-700">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Aviso</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg">Alertas do Sistema</CardTitle>
          <div className="flex items-center gap-2">
            {counts && (
              <div className="flex items-center gap-2 text-sm">
                {counts.critical > 0 && (
                  <Badge className="bg-red-100 text-red-700">{counts.critical} Críticos</Badge>
                )}
                {counts.error > 0 && (
                  <Badge className="bg-orange-100 text-orange-700">{counts.error} Erros</Badge>
                )}
                {counts.warning > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700">{counts.warning} Avisos</Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={resolvedFilter ? 'default' : 'outline'}
            onClick={() => setResolvedFilter(!resolvedFilter)}
            size="sm"
          >
            {resolvedFilter ? 'Ver Não Resolvidos' : 'Ver Resolvidos'}
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      {getSeverityBadge(alert.severity)}
                      <Badge variant="outline">{alert.alert_type}</Badge>
                    </div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(alert.created_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {alert.resolved_at && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Resolvido em {format(new Date(alert.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                  {!alert.resolved_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert.mutate(alert.id)}
                      disabled={resolveAlert.isPending}
                    >
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta encontrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
