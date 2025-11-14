import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useAggregatedGSCQuota } from "@/hooks/useAggregatedGSCQuota";
import { Button } from "@/components/ui/button";

interface GSCQuotaWarningBannerProps {
  siteId: string;
}

export const GSCQuotaWarningBanner = ({ siteId }: GSCQuotaWarningBannerProps) => {
  const { data: quota } = useAggregatedGSCQuota({ siteId });

  if (!quota) return null;

  // Mostrar banner crítico se quota excedida
  if (quota.total_remaining < 0) {
    return (
      <Alert className="border-destructive bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-destructive">Quota GSC Excedida!</AlertTitle>
        <AlertDescription className="text-destructive/90">
          Você excedeu a quota diária em {Math.abs(quota.total_remaining)} requisições.
          A indexação está pausada até amanhã ou até que você adicione mais integrações.
          <div className="mt-2 space-y-1">
            {quota.breakdown
              .filter(b => b.remaining < 0)
              .map(b => (
                <div key={b.integration_id} className="text-sm">
                  <strong>{b.name}</strong>: {b.used}/{b.limit} ({Math.abs(b.remaining)} excedido)
                </div>
              ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Mostrar alerta se quota próxima do limite (>80%)
  if (quota.percentage > 80) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">Quota GSC próxima do limite</AlertTitle>
        <AlertDescription className="text-orange-800">
          Você usou {quota.total_used} de {quota.total_limit} requisições diárias ({quota.percentage}%).
          Restam apenas {quota.total_remaining} requisições. 
          Considere adicionar mais integrações GSC para aumentar sua capacidade.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
