import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { TimelineChart } from "@/components/analytics/TimelineChart";
import { EventsPieChart } from "@/components/analytics/EventsPieChart";
import { TopPagesChart } from "@/components/analytics/TopPagesChart";
import { ConversionsTable } from "@/components/analytics/ConversionsTable";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
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
  
  const { metrics, timeline, events, topPages, conversions, isLoading } = useAnalytics({
    siteId: siteId!,
    period,
    eventType,
    device,
    customStartDate,
    customEndDate,
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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/dashboard/site/${siteId}`)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold">Analytics</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
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

        <MetricsCards metrics={metrics} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimelineChart data={timeline} isLoading={isLoading} />
          <EventsPieChart data={events} isLoading={isLoading} />
        </div>

        <TopPagesChart data={topPages} isLoading={isLoading} />

        <ConversionsTable 
          conversions={conversions} 
          isLoading={isLoading}
          siteId={siteId}
        />
      </div>
    </div>
  );
};

export default Analytics;
