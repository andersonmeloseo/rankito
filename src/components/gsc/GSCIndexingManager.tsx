import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGSCIndexing } from "@/hooks/useGSCIndexing";
import { GSCIndexingHistory } from "./GSCIndexingHistory";
import { RefreshCw, Activity, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCIndexingManagerProps {
  siteId: string;
}

export function GSCIndexingManager({ siteId }: GSCIndexingManagerProps) {
  const { quota, resetAt, refetchQuota, isLoadingQuota } = useGSCIndexing({ siteId });

  const getQuotaColorClass = () => {
    if (!quota) return "bg-gray-500";
    const remaining = quota.remaining;
    if (remaining > 100) return "bg-green-500 text-white";
    if (remaining > 50) return "bg-yellow-500 text-white";
    if (remaining > 0) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className="space-y-8">
      {/* Card Simples de Quota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quota Disponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingQuota ? (
            <Skeleton className="h-16" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getQuotaColorClass()}>
                    {quota?.remaining || 0} URLs disponíveis hoje
                  </Badge>
                  {quota && (
                    <span className="text-sm text-muted-foreground">
                      {quota.used} / {quota.limit} usadas
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchQuota()}
                  disabled={isLoadingQuota}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              
              {resetAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  Reseta em {formatDistanceToNow(new Date(resetAt), { locale: ptBR, addSuffix: true })}
                </p>
              )}

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Como indexar páginas:</strong> Vá para a aba "Páginas do Site", 
                  selecione as páginas desejadas e use a ação em lote "Indexar no GSC". 
                  A fila é processada automaticamente a cada 30 minutos.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Histórico com TODOS os Filtros */}
      <GSCIndexingHistory siteId={siteId} />
    </div>
  );
}
