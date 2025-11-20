import { useState } from "react";
import { useGeolocationAnalytics } from "@/hooks/useGeolocationAnalytics";
import { GeolocationMetricsCards } from "./GeolocationMetricsCards";
import { GeolocationFilters } from "./GeolocationFilters";
import { InteractiveGeolocationMap } from "./InteractiveGeolocationMap";
import { GeoRankingTables } from "./GeoRankingTables";
import { CountryDistributionChart } from "./CountryDistributionChart";
import { RegionalHeatmapChart } from "./RegionalHeatmapChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface GeolocationAnalyticsTabProps {
  userId: string;
}

export const GeolocationAnalyticsTab = ({ userId }: GeolocationAnalyticsTabProps) => {
  const [filters, setFilters] = useState({
    period: '30',
    siteId: 'all',
    eventType: 'all',
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      period: '30',
      siteId: 'all',
      eventType: 'all',
    });
  };

  // Calculate date range based on period filter
  const getDateRange = () => {
    if (filters.period === 'all') return {};
    
    const endDate = new Date().toISOString();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(filters.period));
    
    return {
      startDate: startDate.toISOString(),
      endDate,
    };
  };

  const { data, isLoading, error } = useGeolocationAnalytics(userId, {
    ...getDateRange(),
    siteId: filters.siteId !== 'all' ? filters.siteId : undefined,
    eventType: filters.eventType !== 'all' ? filters.eventType : undefined,
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados de geolocalização. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, countries, cities, regions } = data;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GeolocationFilters
        userId={userId}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Metrics Cards */}
      <GeolocationMetricsCards summary={summary} />

      {/* Main Content: Map + Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InteractiveGeolocationMap 
            cities={cities} 
            totalConversions={summary.totalConversions}
          />
        </div>
        <div className="space-y-6">
          <GeoRankingTables
            countries={countries}
            cities={cities}
            regions={regions}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <CountryDistributionChart countries={countries} />
        <RegionalHeatmapChart regions={regions} />
      </div>
    </div>
  );
};
