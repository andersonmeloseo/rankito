import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { useClientPortalAnalytics } from '@/hooks/useClientPortalAnalytics';
import { useProjectData } from '@/hooks/useProjectData';
import { EpicPortalHeader } from '@/components/client-portal/EpicPortalHeader';
import { ImpactfulOverviewDashboard } from '@/components/client-portal/ImpactfulOverviewDashboard';
import { RealtimeMonitoring } from '@/components/client-portal/RealtimeMonitoring';
import { ContractFinancialDashboard } from '@/components/client-portal/ContractFinancialDashboard';
import { AdvancedAnalytics } from '@/components/client-portal/AdvancedAnalytics';
import { SavedReportsSection } from '@/components/client-portal/SavedReportsSection';
import { ConversionToast } from '@/components/client-portal/ConversionToast';
import { useRealtimeConversions } from '@/hooks/useRealtimeConversions';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { DeviceAnalyticsChart } from '@/components/client-portal/DeviceAnalyticsChart';
import { GeoAnalyticsChart } from '@/components/client-portal/GeoAnalyticsChart';

export const EnhancedClientPortal = () => {
  const { token } = useParams();
  const [periodDays, setPeriodDays] = useState(30);
  const [realtimeEnabled] = useState(true);
  const [soundEnabled] = useState(true);

  const { data: authData, isLoading: authLoading, error: authError } = usePortalAuth(token);
  const clientId = authData?.clientId;
  const clientData = authData?.clientData;

  const { analytics, reports, isLoading: analyticsLoading } = useClientPortalAnalytics(clientId || '', periodDays);
  const { data: projectData, isLoading: projectLoading } = useProjectData(clientId || '');

  const { 
    newConversions: realtimeConversions, 
    liveCount 
  } = useRealtimeConversions(
    clientId ? [clientId] : undefined, 
    realtimeEnabled ? () => {} : undefined
  );
  
  const analyticsData = analytics ? {
    totalConversions: analytics.totalConversions || 0,
    conversionRate: analytics.conversionRate || 0,
    pageViews: analytics.pageViews || 0,
  } : null;
  
  const liveMetrics = useRealtimeMetrics(analyticsData, realtimeConversions);

  const isLoading = authLoading || analyticsLoading || projectLoading;
  const sparklineData = analytics?.dailyStats?.slice(-7).map((d: any) => d.conversions) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (authError || !authData?.isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Portal não encontrado ou acesso negado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ConversionToast conversion={realtimeConversions[0]} soundEnabled={soundEnabled} />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <EpicPortalHeader
          clientName={clientData?.name || 'Portal'}
          clientCompany={clientData?.company}
          projectUrl={projectData?.projectUrl}
          liveConversionsCount={liveCount}
          totalConversions={analytics?.totalConversions || 0}
          totalPageViews={analytics?.pageViews || 0}
          monthlyRevenue={projectData?.monthlyValue || 0}
          conversionRate={analytics?.conversionRate || 0}
          sparklineData={sparklineData}
          daysRemaining={projectData?.daysRemaining}
          contractStatus={projectData?.contractStatus}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ImpactfulOverviewDashboard
              dailyStats={(analytics?.dailyStats as any[]) || []}
              topPages={analytics?.topPages || []}
              totalConversions={analytics?.totalConversions || 0}
              totalPageViews={analytics?.pageViews || 0}
            />
          </TabsContent>

          <TabsContent value="realtime">
            <RealtimeMonitoring conversions={realtimeConversions} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics analytics={analytics} periodDays={periodDays} />
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <DeviceAnalyticsChart data={(analytics?.deviceStats as any[]) || []} />
              <GeoAnalyticsChart data={(analytics?.geoStats as any[]) || []} />
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <ContractFinancialDashboard
              contractStartDate={projectData?.contractStartDate}
              contractEndDate={projectData?.contractEndDate}
              monthlyValue={projectData?.monthlyValue || 0}
              autoRenew={projectData?.autoRenew || false}
              daysRemaining={projectData?.daysRemaining}
              paymentHistory={projectData?.paymentHistory || []}
              contractStatus={projectData?.contractStatus || 'active'}
            />
          </TabsContent>

          <TabsContent value="reports">
            <SavedReportsSection reports={reports} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-6">
          <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair do Portal
          </Button>
        </div>
      </div>
    </div>
  );
};
