import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCLoadDistribution } from "@/hooks/useGSCLoadDistribution";
import { Scale, TrendingUp, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface GSCLoadDistributionCardProps {
  siteId: string;
}

export function GSCLoadDistributionCard({ siteId }: GSCLoadDistributionCardProps) {
  const { data: distribution, isLoading } = useGSCLoadDistribution(siteId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Distribuição de Carga
          </CardTitle>
          <CardDescription>
            Balanceamento de requisições entre integrações GSC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!distribution || distribution.integrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Distribuição de Carga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma integração GSC ativa encontrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getBalanceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getBalanceLabel = (score: number) => {
    if (score >= 0.8) return "Ótimo";
    if (score >= 0.5) return "Moderado";
    return "Desbalanceado";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Distribuição de Carga GSC
        </CardTitle>
        <CardDescription>
          Balanceamento inteligente entre {distribution.integrations.length} integraç{distribution.integrations.length === 1 ? 'ão' : 'ões'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicador de Balanceamento */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            {distribution.is_balanced ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <p className="text-sm font-medium">Status de Balanceamento</p>
              <p className={`text-lg font-bold ${getBalanceColor(distribution.balance_score)}`}>
                {getBalanceLabel(distribution.balance_score)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold">{(distribution.balance_score * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Resumo Total */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Hoje</span>
            </div>
            <p className="text-2xl font-bold">{distribution.total_urls}</p>
            <p className="text-xs text-muted-foreground">URLs indexadas</p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Capacidade</span>
            </div>
            <p className="text-2xl font-bold">
              {distribution.integrations.reduce((sum, int) => sum + int.quota_remaining, 0)}
            </p>
            <p className="text-xs text-muted-foreground">URLs restantes</p>
          </div>
        </div>

        {/* Distribuição por Integração */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Uso por Integração</h4>
          {distribution.integrations.map((integration) => {
            const usagePercent = (integration.quota_used / 200) * 100;
            const isHeavyLoaded = usagePercent > 75;
            
            return (
              <div key={integration.integration_id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{integration.integration_name}</p>
                    <p className="text-xs text-muted-foreground">{integration.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isHeavyLoaded ? "destructive" : "secondary"} className="text-xs">
                      {integration.quota_used}/200
                    </Badge>
                    {integration.success_rate === 100 && integration.urls_indexed_today > 0 && (
                      <Badge variant="outline" className="text-xs">
                        100% sucesso
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Progress 
                    value={usagePercent} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      {integration.quota_remaining} disponíveis
                    </span>
                    {integration.avg_response_time > 0 && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {integration.avg_response_time}ms média
                      </span>
                    )}
                  </div>
                </div>

                {integration.urls_failed_today > 0 && (
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {integration.urls_failed_today} falhas hoje
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dica de Otimização */}
        {!distribution.is_balanced && distribution.integrations.length > 1 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>Dica:</strong> O sistema de rotação automática está ativo e redistribuirá as próximas requisições para melhorar o balanceamento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
