import { Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EdgeFunctionsHealthTableProps {
  metrics: {
    edgeFunctions: {
      totalExecutions: number;
      successRate: number;
      avgExecutionTime: number;
      recentFailures: any[];
    };
    databaseMetrics: {
      totalTables: number;
      totalActiveUsers: number;
      totalSites: number;
      conversionsLast24h: number;
      databaseSize: string;
    };
  };
}

export const EdgeFunctionsHealthTable = ({ metrics }: EdgeFunctionsHealthTableProps) => {
  const { edgeFunctions, databaseMetrics } = metrics;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Edge Functions Stats */}
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Edge Functions - Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Execuções (24h)</div>
              <div className="text-2xl font-bold">{edgeFunctions.totalExecutions}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{edgeFunctions.successRate}%</div>
                {edgeFunctions.successRate >= 95 ? (
                  <Badge variant="default" className="bg-green-500">Excelente</Badge>
                ) : edgeFunctions.successRate >= 90 ? (
                  <Badge variant="default">Bom</Badge>
                ) : (
                  <Badge variant="destructive">Atenção</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tempo Médio</div>
              <div className="text-2xl font-bold">{edgeFunctions.avgExecutionTime}ms</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Falhas Recentes</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{edgeFunctions.recentFailures.length}</div>
                {edgeFunctions.recentFailures.length > 0 ? (
                  <Badge variant="destructive">Revisar</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">OK</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Metrics */}
      <Card className="shadow-card hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas do Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tamanho do Banco</div>
              <div className="text-2xl font-bold">{databaseMetrics.databaseSize}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total de Tabelas</div>
              <div className="text-2xl font-bold">{databaseMetrics.totalTables}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              <div className="text-2xl font-bold">{databaseMetrics.totalActiveUsers}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total de Sites</div>
              <div className="text-2xl font-bold">{databaseMetrics.totalSites}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Conversões (24h)</div>
              <div className="text-2xl font-bold text-green-600">
                {databaseMetrics.conversionsLast24h}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
