import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { FinancialSummaryCards } from "./FinancialSummaryCards";
import { QuickCostEditor } from "./QuickCostEditor";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { SimpleFinancialTable } from "./SimpleFinancialTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FinancialHubProps {
  siteId: string;
}

export const FinancialHub = ({ siteId }: FinancialHubProps) => {
  const { config, metrics, summary, isLoading, saveConfig } = useFinancialMetrics(siteId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const hasLowROI = metrics.some(m => Number(m.roi_percentage) < 0);
  const hasNegativeProfit = metrics.some(m => Number(m.monthly_profit) < 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <FinancialSummaryCards
        totalRevenue={summary.totalRevenue}
        totalCosts={summary.totalCosts}
        totalProfit={summary.totalProfit}
        avgROI={summary.avgROI}
        totalPages={summary.totalPages}
        profitablePages={summary.profitablePages}
      />

      {/* Alerts for negative performance */}
      {(hasLowROI || hasNegativeProfit) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção: Performance Negativa Detectada</AlertTitle>
          <AlertDescription>
            {hasNegativeProfit && "Algumas páginas estão operando com prejuízo. "}
            {hasLowROI && "Algumas páginas têm ROI negativo. "}
            Revise suas configurações de custo e considere ajustar os valores de aluguel ou reduzir custos operacionais.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration & Simulator */}
      <div className="grid md:grid-cols-2 gap-6">
      <QuickCostEditor
        config={config}
        onSave={(newConfig) => {
          const fullConfig = {
            business_model: newConfig.business_model || config?.business_model || "full_site",
            cost_per_conversion: newConfig.cost_per_conversion ?? config?.cost_per_conversion ?? 0,
            monthly_fixed_costs: newConfig.monthly_fixed_costs ?? config?.monthly_fixed_costs ?? 0,
            acquisition_cost: newConfig.acquisition_cost ?? config?.acquisition_cost ?? 0,
            notes: newConfig.notes ?? config?.notes ?? "",
          };
          saveConfig.mutate(fullConfig);
        }}
        isSaving={saveConfig.isPending}
        totalPages={summary.totalPages}
        totalRevenue={summary.totalRevenue}
      />
        <ScenarioSimulator metrics={metrics} config={config} />
      </div>

      {/* Simple Performance Table */}
      <SimpleFinancialTable metrics={metrics} />
    </div>
  );
};
