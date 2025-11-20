import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProblematicIntegrationsTableProps {
  metrics: {
    gscIntegrations: {
      problematicIntegrations: Array<{
        siteId: string;
        siteName: string;
        connectionName: string;
        healthStatus: string;
        consecutiveFailures: number;
        lastError: string;
      }>;
    };
  };
}

export const ProblematicIntegrationsTable = ({ metrics }: ProblematicIntegrationsTableProps) => {
  const navigate = useNavigate();
  const { problematicIntegrations } = metrics.gscIntegrations;

  const getHealthStatusVariant = (status: string): "default" | "destructive" | "warning" => {
    if (status === 'unhealthy') return 'destructive';
    if (status === 'warning') return 'warning';
    return 'default';
  };

  if (problematicIntegrations.length === 0) {
    return (
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Integrações GSC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Todas Integrações Saudáveis!</h3>
            <p className="text-sm text-muted-foreground">
              Nenhuma integração GSC apresentando problemas no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Integrações GSC com Problemas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Conexão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Falhas</TableHead>
              <TableHead>Último Erro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problematicIntegrations.map((integration, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">
                  {integration.siteName}
                </TableCell>
                <TableCell>{integration.connectionName}</TableCell>
                <TableCell>
                  <Badge variant={getHealthStatusVariant(integration.healthStatus)}>
                    {integration.healthStatus === 'unhealthy' ? 'Não Saudável' : integration.healthStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="destructive" className="font-mono">
                    {integration.consecutiveFailures}x
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-xs">
                  {integration.lastError}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/sites/${integration.siteId}`)}
                    className="gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver Site
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
