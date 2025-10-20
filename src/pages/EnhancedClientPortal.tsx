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
import { OverviewTab } from '@/components/client-portal/OverviewTab';
import { ConversionsTab } from '@/components/client-portal/ConversionsTab';
import { PageViewsTab } from '@/components/client-portal/PageViewsTab';
import { RealtimeMonitoring } from '@/components/client-portal/RealtimeMonitoring';
import { ContractFinancialDashboard } from '@/components/client-portal/ContractFinancialDashboard';
import { ConversionToast } from '@/components/client-portal/ConversionToast';
import { useRealtimeConversions } from '@/hooks/useRealtimeConversions';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { MetricsCards } from '@/components/analytics/MetricsCards';
import { EmptyState } from '@/components/client-portal/EmptyState';

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

  const isLoading = authLoading || analyticsLoading || projectLoading || !clientId;
  const sparklineData = analytics?.dailyStats?.slice(-7).map((d: any) => d.conversions) || [];

  console.log('[Portal] 📊 Estado do Analytics:', {
    hasAnalytics: !!analytics,
    isEmpty: analytics?.isEmpty,
    totalConversions: analytics?.totalConversions,
    isLoading,
    clientId
  });

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

  // Show empty state if no analytics data
  if (analytics?.isEmpty) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <EpicPortalHeader
            clientName={clientData?.name || 'Portal'}
            clientCompany={clientData?.company}
            projectUrl={projectData?.projectUrl}
            liveConversionsCount={0}
            totalConversions={0}
            totalPageViews={0}
            monthlyRevenue={projectData?.monthlyValue || 0}
            conversionRate={0}
            sparklineData={[]}
            daysRemaining={projectData?.daysRemaining}
            contractStatus={projectData?.contractStatus}
          />
          <EmptyState 
            title="Nenhum dado disponível ainda"
            description="Aguardando as primeiras conversões e visualizações do seu site. Instale o plugin de rastreamento para começar a coletar dados."
            icon="chart"
          />
        </div>
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

        {/* Professional Metrics Cards */}
        <MetricsCards
          metrics={{
            uniqueVisitors: analytics?.uniqueVisitors || 0,
            uniquePages: analytics?.uniquePages || 0,
            pageViews: analytics?.pageViews || 0,
            conversions: analytics?.totalConversions || 0,
            conversionRate: analytics?.conversionRate?.toFixed(2) || '0.00',
          }}
          previousMetrics={analytics?.previousPeriodMetrics || {
            uniqueVisitors: 0,
            uniquePages: 0,
            pageViews: 0,
            conversions: 0,
            conversionRate: 0
          }}
          sparklineData={analytics?.sparklineData || { pageViews: [], conversions: [] }}
          isLoading={false}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
            <TabsTrigger value="conversions">🎯 Conversões</TabsTrigger>
            <TabsTrigger value="pageviews">👁️ Visualizações</TabsTrigger>
            <TabsTrigger value="realtime">⚡ Tempo Real</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="conversions">
            <ConversionsTab 
              analytics={analytics} 
              siteIds={analytics?.sites?.map((s: any) => s.id) || []} 
            />
          </TabsContent>

          <TabsContent value="pageviews">
            <PageViewsTab 
              analytics={analytics} 
              siteIds={analytics?.sites?.map((s: any) => s.id) || []} 
            />
          </TabsContent>

          <TabsContent value="realtime">
            <RealtimeMonitoring conversions={realtimeConversions} />
          </TabsContent>
        </Tabs>

        {/* Financial Section - Separate from tabs */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">💰 Informações Financeiras</h2>
          <ContractFinancialDashboard
            contractStartDate={projectData?.contractStartDate}
            contractEndDate={projectData?.contractEndDate}
            monthlyValue={projectData?.monthlyValue || 0}
            autoRenew={projectData?.autoRenew || false}
            daysRemaining={projectData?.daysRemaining}
            paymentHistory={projectData?.paymentHistory || []}
            contractStatus={projectData?.contractStatus || 'active'}
          />
        </div>

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
