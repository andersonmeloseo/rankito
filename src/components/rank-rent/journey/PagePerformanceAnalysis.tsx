import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PagePerformanceData } from "@/hooks/useSessionAnalytics";
import { PagePerformanceCard } from "./PagePerformanceCard";
import { pagePerformanceInsights } from "./pagePerformanceInsights";
import { Trophy, AlertTriangle, Target, Zap } from "lucide-react";

interface PagePerformanceAnalysisProps {
  pagePerformance: PagePerformanceData[];
}

export const PagePerformanceAnalysis = ({ pagePerformance }: PagePerformanceAnalysisProps) => {
  if (!pagePerformance || pagePerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Performance por Página</CardTitle>
          <CardDescription>
            Nenhum dado disponível ainda. Aguarde as primeiras visitas às páginas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate average metrics for comparison
  const avgBounceRate = pagePerformance.reduce((acc, p) => acc + p.bounceRate, 0) / pagePerformance.length;
  const avgTimeOnPage = pagePerformance.reduce((acc, p) => acc + p.avgTimeOnPage, 0) / pagePerformance.length;
  const avgConversionRate = pagePerformance.reduce((acc, p) => acc + p.conversionRate, 0) / pagePerformance.length;

  // Categorize pages
  const champions = pagePerformance.filter(p => 
    p.avgTimeOnPage > avgTimeOnPage && 
    p.bounceRate < 50 && 
    p.conversions > 0
  ).slice(0, 5);

  const alerts = pagePerformance.filter(p => 
    p.bounceRate > 70 || p.avgTimeOnPage < 10
  ).slice(0, 5);

  const opportunities = pagePerformance.filter(p => 
    p.totalVisits >= (pagePerformance[0]?.totalVisits || 0) * 0.3 && // Top 30% traffic
    p.conversionRate < avgConversionRate &&
    !alerts.some(a => a.page_url === p.page_url) // Exclude alerts
  ).slice(0, 5);

  const highConversion = pagePerformance
    .filter(p => p.conversions > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Análise de Performance por Página</CardTitle>
          <CardDescription>
            Insights estratégicos sobre o desempenho individual de cada página do seu site
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PagePerformanceCard
          pages={champions}
          insight={pagePerformanceInsights.champions}
          icon={<Trophy className="h-5 w-5" />}
        />
        
        <PagePerformanceCard
          pages={alerts}
          insight={pagePerformanceInsights.alerts}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        
        <PagePerformanceCard
          pages={opportunities}
          insight={pagePerformanceInsights.opportunities}
          icon={<Target className="h-5 w-5" />}
        />
        
        <PagePerformanceCard
          pages={highConversion}
          insight={pagePerformanceInsights.highConversion}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>
    </div>
  );
};
