import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { TimelineChart } from "@/components/analytics/TimelineChart";
import { EventsPieChart } from "@/components/analytics/EventsPieChart";
import { TopPagesChart } from "@/components/analytics/TopPagesChart";
import { ConversionsTable } from "@/components/analytics/ConversionsTable";
import { PageViewsTable } from "@/components/analytics/PageViewsTable";
import { PageViewsTimelineChart } from "@/components/analytics/PageViewsTimelineChart";
import { TopReferrersChart } from "@/components/analytics/TopReferrersChart";
import { PagePerformanceChart } from "@/components/analytics/PagePerformanceChart";
import { ConversionFunnelChart } from "@/components/analytics/ConversionFunnelChart";
import { HourlyHeatmap } from "@/components/analytics/HourlyHeatmap";
import { ConversionRateChart } from "@/components/analytics/ConversionRateChart";
import { ConversionsTimelineChart } from "@/components/analytics/ConversionsTimelineChart";
import { TopConversionPagesChart } from "@/components/analytics/TopConversionPagesChart";
import { ConversionTypeDistributionChart } from "@/components/analytics/ConversionTypeDistributionChart";
import { ConversionHeatmapChart } from "@/components/analytics/ConversionHeatmapChart";
import { PageViewsHeatmapChart } from "@/components/analytics/PageViewsHeatmapChart";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Card } from "@/components/ui/card";

const Analytics = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  
  const [period, setPeriod] = useState("30");
  const [eventType, setEventType] = useState("all");
  const [device, setDevice] = useState("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  const { 
    metrics, 
    previousMetrics, 
    timeline, 
    events, 
    topPages, 
    conversions, 
    pageViewsList,
    funnelData,
    hourlyData,
    sparklineData,
    conversionRateData,
    pageViewsTimeline,
    topReferrers,
    pagePerformance,
    conversionsTimeline,
    topConversionPages,
    conversionTypeDistribution,
    conversionHourlyData,
    pageViewHourlyData,
    isLoading
  } = useAnalytics({
    siteId: siteId!,
    period,
    eventType,
    device,
    customStartDate,
    customEndDate,
  });

  // Debug logs
  console.log('🔍 Analytics Data Debug:', {
    conversionsTimeline,
    topConversionPages,
    conversionTypeDistribution,
    conversionHourlyData,
    isLoading
  });

  if (!siteId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Site não encontrado</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/dashboard/site/${siteId}`)}
                className="gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Analytics Avançado
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <AnalyticsFilters
          period={period}
          eventType={eventType}
          device={device}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onPeriodChange={setPeriod}
          onEventTypeChange={setEventType}
          onDeviceChange={setDevice}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />

        <MetricsCards 
          metrics={metrics} 
          previousMetrics={previousMetrics}
          sparklineData={sparklineData}
          isLoading={isLoading} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimelineChart data={timeline} isLoading={isLoading} />
          <EventsPieChart data={events} isLoading={isLoading} />
        </div>

        <ConversionRateChart 
          data={conversionRateData || []} 
          isLoading={isLoading} 
        />

        <ConversionFunnelChart 
          data={funnelData || { pageViews: 0, interactions: 0, conversions: 0 }} 
          isLoading={isLoading} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPagesChart data={topPages} isLoading={isLoading} />
          <HourlyHeatmap data={hourlyData || []} isLoading={isLoading} />
        </div>

        <Tabs defaultValue="conversions" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card shadow-sm">
            <TabsTrigger value="conversions" className="gap-2">
              📊 Conversões
            </TabsTrigger>
            <TabsTrigger value="pageviews" className="gap-2">
              👁️ Page Views
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversions" className="mt-6 space-y-6">
            <ConversionsTimelineChart 
              data={conversionsTimeline || []} 
              isLoading={isLoading}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopConversionPagesChart 
                data={topConversionPages || []} 
                isLoading={isLoading}
              />
              <ConversionTypeDistributionChart 
                data={conversionTypeDistribution || []} 
                isLoading={isLoading}
              />
            </div>
            
            <ConversionHeatmapChart 
              data={conversionHourlyData || {}} 
              isLoading={isLoading}
            />
            
            <ConversionsTable 
              conversions={conversions || []} 
              isLoading={isLoading}
              siteId={siteId}
            />
          </TabsContent>
          
          <TabsContent value="pageviews" className="mt-6 space-y-6">
            <PageViewsTimelineChart 
              data={pageViewsTimeline || []} 
              isLoading={isLoading}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopReferrersChart 
                data={topReferrers || []} 
                isLoading={isLoading}
              />
              <PagePerformanceChart 
                data={pagePerformance || []} 
                isLoading={isLoading}
              />
            </div>

            <PageViewsHeatmapChart 
              data={pageViewHourlyData || {}} 
              isLoading={isLoading}
            />

            <PageViewsTable 
              pageViews={pageViewsList || []} 
              isLoading={isLoading}
              siteId={siteId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
