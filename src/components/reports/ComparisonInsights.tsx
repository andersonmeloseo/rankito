import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportData } from "@/hooks/useReportData";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign } from "lucide-react";
import { formatCurrency, useReportTranslation } from "@/i18n/reportTranslations";

interface ComparisonInsightsProps {
  reportData: ReportData;
}

export const ComparisonInsights = ({ reportData }: ComparisonInsightsProps) => {
  if (!reportData.comparison && !reportData.financial) return null;

  const locale = reportData.financial?.locale || 'pt-BR';
  const { t } = useReportTranslation(locale);

  const insights: Array<{ type: 'success' | 'warning' | 'info'; message: string; icon: React.ReactNode }> = [];

  // Financial insights (always show if available)
  if (reportData.financial) {
    const { costPerConversion, currency, totalValue } = reportData.financial;
    const formattedValue = formatCurrency(totalValue, currency);
    const formattedCost = formatCurrency(costPerConversion, currency);

    insights.push({
      type: 'success',
      message: t('savingsMessage', {
        conversions: reportData.summary.totalConversions,
        costPer: formattedCost,
        value: formattedValue
      }),
      icon: <DollarSign className="h-4 w-4" />
    });
  }

  if (!reportData.comparison) {
    return insights.length > 0 ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 {t('comparisonInsight')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, i) => (
            <Alert 
              key={i} 
              variant="default"
              className="border-green-500 bg-green-50 dark:bg-green-950"
            >
              <div className="flex items-start gap-2">
                {insight.icon}
                <AlertDescription className="flex-1">{insight.message}</AlertDescription>
              </div>
            </Alert>
          ))}
        </CardContent>
      </Card>
    ) : null;
  }

  // Conversions insights
  if (reportData.comparison.conversionsChange > 10) {
    insights.push({
      type: 'success',
      message: t('excellentGrowth', { change: reportData.comparison.conversionsChange.toFixed(1) }),
      icon: <TrendingUp className="h-4 w-4" />
    });
  } else if (reportData.comparison.conversionsChange < -10) {
    insights.push({
      type: 'warning',
      message: t('attentionDrop', { change: Math.abs(reportData.comparison.conversionsChange).toFixed(1) }),
      icon: <TrendingDown className="h-4 w-4" />
    });
  }

  // Page Views insights
  if (reportData.comparison.pageViewsChange > 20) {
    insights.push({
      type: 'success',
      message: t('trafficGrowth', { change: reportData.comparison.pageViewsChange.toFixed(1) }),
      icon: <TrendingUp className="h-4 w-4" />
    });
  }

  // Conversion Rate insights
  if (reportData.comparison.conversionRateChange > 1) {
    insights.push({
      type: 'success',
      message: t('conversionRateImproved', { change: reportData.comparison.conversionRateChange.toFixed(2) }),
      icon: <TrendingUp className="h-4 w-4" />
    });
  } else if (reportData.comparison.conversionRateChange < -1) {
    insights.push({
      type: 'warning',
      message: t('conversionRateDropped', { change: Math.abs(reportData.comparison.conversionRateChange).toFixed(2) }),
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
          💡 {t('comparisonInsight')}
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
