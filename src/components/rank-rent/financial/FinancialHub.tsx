import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { FinancialSummaryCards } from "./FinancialSummaryCards";
import { CostConfigurationForm } from "./CostConfigurationForm";
import { FinancialPerformanceTable } from "./FinancialPerformanceTable";
import { ProfitabilityCharts } from "./ProfitabilityCharts";
import { ComparativeAnalysis } from "./ComparativeAnalysis";
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

      {/* Cost Configuration Form */}
      <CostConfigurationForm
        config={config}
        onSave={(newConfig) => saveConfig.mutate(newConfig)}
        isSaving={saveConfig.isPending}
      />

      {/* Charts */}
      <ProfitabilityCharts metrics={metrics} />

      {/* Comparative Analysis */}
      <ComparativeAnalysis metrics={metrics} />

      {/* Performance Table */}
      <FinancialPerformanceTable metrics={metrics} />
    </div>
  );
};
