import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HourlyHeatmap } from "@/components/analytics/HourlyHeatmap";
import { PagePerformanceChart } from "@/components/analytics/PagePerformanceChart";
import { DeviceAnalyticsChart } from "./DeviceAnalyticsChart";
import { GeoAnalyticsChart } from "./GeoAnalyticsChart";
import { PeriodComparisonChart } from "./PeriodComparisonChart";
import { EmptyState } from "./EmptyState";

interface AdvancedAnalyticsProps {
  analytics: any;
  periodDays: number;
}

export const AdvancedAnalytics = ({ analytics, periodDays }: AdvancedAnalyticsProps) => {
  if (!analytics || analytics.isEmpty) {
    return <EmptyState title="Analytics Avançado" description="Dados insuficientes para análise avançada" />;
  }

  return (
    <div className="space-y-6">
      {/* Period Comparison */}
      <PeriodComparisonChart 
        currentPeriodData={analytics.dailyStats || []} 
        periodDays={periodDays}
      />

      {/* Hourly Heatmap */}
      {analytics.hourlyStats && analytics.hourlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Mapa de Calor - Horários</CardTitle>
          </CardHeader>
          <CardContent>
            <HourlyHeatmap data={analytics.hourlyStats} isLoading={false} />
          </CardContent>
        </Card>
      )}

      {/* Device & Geo Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        {analytics.deviceStats && analytics.deviceStats.length > 0 && (
          <DeviceAnalyticsChart data={analytics.deviceStats} />
        )}
        
        {analytics.geoStats && analytics.geoStats.length > 0 && (
          <GeoAnalyticsChart data={analytics.geoStats} />
        )}
      </div>

      {/* Page Performance */}
      {analytics.topPages && analytics.topPages.length > 0 && (
        <PagePerformanceChart 
          data={analytics.topPages.map((p: any) => ({
            page: p.path,
            views: p.pageViews,
            conversions: p.conversions,
            conversionRate: p.conversionRate,
          }))}
          isLoading={false}
        />
      )}
    </div>
  );
};
