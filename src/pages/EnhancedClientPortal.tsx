import { useParams } from 'react-router-dom';
import { useState } from 'react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { ContractFinancialDashboard } from '@/components/client-portal/ContractFinancialDashboard';
import { ConversionToast } from '@/components/client-portal/ConversionToast';
import { useRealtimeConversions } from '@/hooks/useRealtimeConversions';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { MetricsCards } from '@/components/analytics/MetricsCards';
import { EmptyState } from '@/components/client-portal/EmptyState';
import { SavedReportsSection } from '@/components/client-portal/SavedReportsSection';
import { ProjectSelector } from '@/components/client-portal/ProjectSelector';

export const EnhancedClientPortal = () => {
  const { token } = useParams();
  const [periodDays, setPeriodDays] = useState(30);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: authData, isLoading: authLoading, error: authError } = usePortalAuth(token);
  const clientId = authData?.clientId;
  const clientData = authData?.clientData;

  // Fetch all client projects
  const { data: clientProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rank_rent_sites')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_rented', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  // Auto-select project if only one exists
  React.useEffect(() => {
    if (clientProjects && clientProjects.length === 1 && !selectedProjectId) {
      setSelectedProjectId(clientProjects[0].id);
    }
  }, [clientProjects, selectedProjectId]);

  const { analytics, reports, isLoading: analyticsLoading } = useClientPortalAnalytics(
    clientId || '', 
    periodDays,
    selectedProjectId || undefined
  );
  const { data: projectData, isLoading: projectLoading } = useProjectData(
    clientId || '', 
    selectedProjectId || undefined
  );

  const { 
    newConversions: realtimeConversions, 
    liveCount 
  } = useRealtimeConversions(
    clientId ? [clientId] : undefined, 
    () => {}
  );
  
  const analyticsData = analytics ? {
    totalConversions: analytics.totalConversions || 0,
    conversionRate: analytics.conversionRate || 0,
    pageViews: analytics.pageViews || 0,
  } : null;
  
  const liveMetrics = useRealtimeMetrics(analyticsData, realtimeConversions);

  const isLoading = authLoading || projectsLoading || (clientId && analyticsLoading) || (clientId && projectLoading);
  const sparklineData = analytics?.dailyStats?.slice(-7).map((d: any) => d.conversions) || [];

  // Show project selector if multiple projects and none selected
  if (!isLoading && clientProjects && clientProjects.length > 1 && !selectedProjectId) {
    return <ProjectSelector projects={clientProjects} onSelectProject={setSelectedProjectId} />;
  }

  console.log('[Portal] 📊 Estado do Analytics:', {
    hasAnalytics: !!analytics,
    isEmpty: analytics?.isEmpty,
    totalConversions: analytics?.totalConversions,
    isLoading,
    clientId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl container mx-auto py-6 space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    console.error('[Portal] ❌ Erro de autenticação:', authError);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {authError.message || 'Erro ao validar acesso ao portal'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!authData?.isValid || !clientId) {
    console.error('[Portal] ❌ Token inválido ou clientId ausente:', { isValid: authData?.isValid, clientId });
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
        <div className="max-w-7xl container mx-auto py-6 space-y-6">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <ConversionToast conversion={realtimeConversions[0]} soundEnabled={true} />
      
      <div className="max-w-7xl container mx-auto py-12 space-y-10">
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
          nextPaymentDate={projectData?.nextPaymentDate}
          nextPaymentAmount={projectData?.nextPaymentAmount}
          paymentStatus={projectData?.paymentStatus}
          showProjectSwitch={clientProjects && clientProjects.length > 1}
          onSwitchProject={() => setSelectedProjectId(null)}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
            <TabsTrigger value="conversions">🎯 Conversões</TabsTrigger>
            <TabsTrigger value="pageviews">👁️ Visualizações</TabsTrigger>
            <TabsTrigger value="financeiro">💰 Financeiro</TabsTrigger>
            <TabsTrigger value="relatorios">📄 Relatórios</TabsTrigger>
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

          <TabsContent value="financeiro">
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

          <TabsContent value="relatorios">
            <SavedReportsSection reports={reports || []} />
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
