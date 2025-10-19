import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportData } from "@/hooks/useReportData";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ComparisonInsightsProps {
  reportData: ReportData;
}

export const ComparisonInsights = ({ reportData }: ComparisonInsightsProps) => {
  if (!reportData.comparison) return null;

  const insights: Array<{ type: 'success' | 'warning' | 'info'; message: string; icon: React.ReactNode }> = [];

  // Conversions insights
  if (reportData.comparison.conversionsChange > 10) {
    insights.push({
      type: 'success',
      message: `Excelente! As conversões cresceram ${reportData.comparison.conversionsChange.toFixed(1)}% em relação ao período anterior.`,
      icon: <TrendingUp className="h-4 w-4" />
    });
  } else if (reportData.comparison.conversionsChange < -10) {
    insights.push({
      type: 'warning',
      message: `Atenção: Queda de ${Math.abs(reportData.comparison.conversionsChange).toFixed(1)}% nas conversões. Revise suas estratégias.`,
      icon: <TrendingDown className="h-4 w-4" />
    });
  } else if (Math.abs(reportData.comparison.conversionsChange) <= 10) {
    insights.push({
      type: 'info',
      message: `Conversões estáveis com variação de ${reportData.comparison.conversionsChange.toFixed(1)}%.`,
      icon: <AlertCircle className="h-4 w-4" />
    });
  }

  // Page Views insights
  if (reportData.comparison.pageViewsChange > 20) {
    insights.push({
      type: 'success',
      message: `Tráfego cresceu ${reportData.comparison.pageViewsChange.toFixed(1)}%! Suas ações de marketing estão funcionando.`,
      icon: <TrendingUp className="h-4 w-4" />
    });
  } else if (reportData.comparison.pageViewsChange < -20) {
    insights.push({
      type: 'warning',
      message: `Tráfego caiu ${Math.abs(reportData.comparison.pageViewsChange).toFixed(1)}%. Considere novas estratégias de aquisição.`,
      icon: <TrendingDown className="h-4 w-4" />
    });
  }

  // Conversion Rate insights
  if (reportData.comparison.conversionRateChange > 1) {
    insights.push({
      type: 'success',
      message: `Taxa de conversão melhorou em ${reportData.comparison.conversionRateChange.toFixed(2)} pontos percentuais.`,
      icon: <TrendingUp className="h-4 w-4" />
    });
  } else if (reportData.comparison.conversionRateChange < -1) {
    insights.push({
      type: 'warning',
      message: `Taxa de conversão caiu ${Math.abs(reportData.comparison.conversionRateChange).toFixed(2)} pontos. Otimize suas páginas.`,
      icon: <TrendingDown className="h-4 w-4" />
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 Insights da Comparação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <Alert 
            key={i} 
            variant={insight.type === 'warning' ? 'destructive' : 'default'}
            className={insight.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
          >
            <div className="flex items-start gap-2">
              {insight.icon}
              <AlertDescription className="flex-1">{insight.message}</AlertDescription>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
