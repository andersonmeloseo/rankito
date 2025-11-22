import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GSCIntegrationHealthCardProps {
  integration: {
    id: string;
    connection_name: string;
    google_email: string | null;
    health_status: string | null;
    consecutive_failures: number | null;
    last_error: string | null;
    health_check_at: string | null;
    is_active: boolean | null;
  };
  onTestConnection?: (integrationId: string) => void;
  onDiagnose?: (integrationId: string) => void;
  isTestingConnection?: boolean;
  isDiagnosing?: boolean;
}

export const GSCIntegrationHealthCard = ({
  integration,
  onTestConnection,
  onDiagnose,
  isTestingConnection = false,
  isDiagnosing = false,
}: GSCIntegrationHealthCardProps) => {
  const getHealthIcon = () => {
    switch (integration.health_status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getHealthBadge = () => {
    switch (integration.health_status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-700">Saudável</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-700">Problemas Detectados</Badge>;
      default:
        return <Badge variant="outline">Não Verificado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getHealthIcon()}
            Status de Saúde da Integração
          </CardTitle>
          {getHealthBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Conexão</p>
            <p className="font-medium">{integration.connection_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email GSC</p>
            <p className="font-medium text-sm truncate">{integration.google_email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Falhas Consecutivas</p>
            <p className="font-medium">{integration.consecutive_failures || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={integration.is_active ? 'default' : 'outline'}>
              {integration.is_active ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
        </div>

        {integration.last_error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Último Erro:</p>
            <p className="text-sm text-red-700 mt-1">{integration.last_error}</p>
          </div>
        )}

        {integration.health_check_at && (
          <div>
            <p className="text-sm text-muted-foreground">Última Verificação</p>
            <p className="text-sm font-medium">
              {format(new Date(integration.health_check_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}

        {onTestConnection && (
          <div className="flex gap-2">
            <Button
              onClick={() => onTestConnection(integration.id)}
              disabled={isTestingConnection || isDiagnosing}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
              {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
            </Button>
            {onDiagnose && (
              <Button
                onClick={() => onDiagnose(integration.id)}
                disabled={isTestingConnection || isDiagnosing}
                className="flex-1"
                variant="default"
              >
                <Stethoscope className={`h-4 w-4 mr-2 ${isDiagnosing ? 'animate-pulse' : ''}`} />
                {isDiagnosing ? 'Diagnosticando...' : 'Diagnosticar'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
