import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, FileText, TrendingDown } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface SessionMetricsProps {
  metrics: {
    totalSessions: number;
    avgDuration: number;
    avgPagesPerSession: number;
    bounceRate: number;
  };
}

export const SessionMetrics = ({ metrics }: SessionMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalSessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Últimos 30 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(metrics.avgDuration)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tempo por sessão
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Páginas/Sessão</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgPagesPerSession}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Média de navegação
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.bounceRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Sessões de 1 página
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
