import { useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { useClientPortalAnalytics } from '@/hooks/useClientPortalAnalytics';
import { useProjectData } from '@/hooks/useProjectData';
import { EpicPortalHeader } from '@/components/client-portal/EpicPortalHeader';
import { OverviewTab } from '@/components/client-portal/OverviewTab';
import { ConversionsTab } from '@/components/client-portal/ConversionsTab';
import { PageViewsTab } from '@/components/client-portal/PageViewsTab';
import { EcommerceTab } from '@/components/client-portal/EcommerceTab';
import { ContractFinancialDashboard } from '@/components/client-portal/ContractFinancialDashboard';
import { ConversionToast } from '@/components/client-portal/ConversionToast';
import { useRealtimeConversions } from '@/hooks/useRealtimeConversions';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { MetricsCards } from '@/components/analytics/MetricsCards';
import { EmptyState } from '@/components/client-portal/EmptyState';
import { SavedReportsSection } from '@/components/client-portal/SavedReportsSection';
import { ProjectSelector } from '@/components/client-portal/ProjectSelector';
import { PeriodSelector } from '@/components/analytics/PeriodSelector';
import { ConversionGoalsTab } from '@/components/client-portal/ConversionGoalsTab';

export const EnhancedClientPortal = () => {
  const { token } = useParams();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Destruir cache completamente ao montar o portal
  const queryClient = useQueryClient();
  
  useEffect(() => {
    console.log('[Portal] 🧹 INVALIDANDO TODAS AS QUERIES DO REACT QUERY...');
    try {
      // Remove TODAS as queries do cache
      queryClient.clear();
      // Invalida todas as queries
      queryClient.invalidateQueries();
      
      // Limpa storage
      localStorage.removeItem('portal-auth-cache');
      sessionStorage.clear();
      
      console.log('[Portal] ✅ Cache React Query e Storage completamente limpos');
    } catch (e) {
      console.warn('[Portal] ⚠️ Erro ao limpar cache:', e);
    }
  }, [token, queryClient]);

  // Initialize with last 30 days
  React.useEffect(() => {
    if (!startDate && !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, []);

  // Calculate period days from dates
  const periodDays = React.useMemo(() => {
    if (!startDate || !endDate) return 30;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  const handlePeriodChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const { data: authData, isLoading: authLoading, error: authError } = usePortalAuth(token);
  
  console.log('[Portal] 🔍 authData recebido:', { 
    hasAuthData: !!authData, 
    clientId: authData?.clientId 
  });
  
  const clientId = authData?.clientId;
  const clientData = authData?.clientData;
  const customization = authData?.customization || {};

  // Track previous customization to detect changes
  const prevCustomizationRef = useRef(customization);

  // Apply branding on initial load
  useEffect(() => {
    if (customization?.branding) {
      console.log('🎨 [Portal] Aplicando customizações iniciais:', customization.branding);
      
      document.documentElement.style.setProperty('--portal-primary', customization.branding.primary_color);
      document.documentElement.style.setProperty('--portal-secondary', customization.branding.secondary_color);
      document.documentElement.style.setProperty('--portal-accent', customization.branding.accent_color);
    }
  }, [customization?.branding?.primary_color, customization?.branding?.secondary_color, customization?.branding?.accent_color]);

  // Detect and apply branding changes
  useEffect(() => {
    if (customization?.branding) {
      const currentCustomization = JSON.stringify(customization);
      const previousCustomization = JSON.stringify(prevCustomizationRef.current);
      
      // Only apply if really changed (compare by value)
      if (currentCustomization !== previousCustomization) {
        console.log('🎨 [Portal] Aplicando novas customizações:', customization.branding);
        console.log('🎨 [Portal] Cores aplicadas:', {
          primary: customization.branding.primary_color,
          secondary: customization.branding.secondary_color,
          accent: customization.branding.accent_color
        });
        
        document.documentElement.style.setProperty('--portal-primary', customization.branding.primary_color);
        document.documentElement.style.setProperty('--portal-secondary', customization.branding.secondary_color);
        document.documentElement.style.setProperty('--portal-accent', customization.branding.accent_color);
        
        prevCustomizationRef.current = customization;
      }
    }
  }, [customization]);

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

  // Debug log para e-commerce
  React.useEffect(() => {
    if (analytics) {
      console.log('[Portal] 🛒 E-commerce Debug COMPLETO:', {
        hasAnalytics: !!analytics,
        hasEcommerce: !!analytics?.ecommerce,
        ecommerceData: analytics?.ecommerce,
        totalConversions: analytics?.totalConversions,
        clientId,
        selectedProjectId
      });
    }
  }, [analytics, clientId, selectedProjectId]);

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

  console.log('[Portal] 🛒 E-commerce data:', {
    hasEcommerce: !!analytics?.ecommerce,
    totalRevenue: analytics?.ecommerce?.totalRevenue,
    totalOrders: analytics?.ecommerce?.totalOrders,
    topProducts: analytics?.ecommerce?.topProducts?.length,
    funnel: analytics?.ecommerce?.funnel
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
          customization={customization}
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
      
      <div className="max-w-[1800px] container mx-auto py-16 space-y-12 px-8">
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
          customization={customization}
        />

        {/* Period Selector */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Período de Análise</h2>
          <PeriodSelector 
            onPeriodChange={handlePeriodChange}
            defaultPeriod={30}
          />
        </div>

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

        <Tabs defaultValue="overview" className="space-y-10">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 gap-2">
            <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
            <TabsTrigger value="conversions">🎯 Conversões</TabsTrigger>
            <TabsTrigger value="pageviews">👁️ Visualizações</TabsTrigger>
            {analytics?.ecommerce && (
              <TabsTrigger value="ecommerce" className="relative">
                🛒 E-commerce
                {analytics.ecommerce.totalOrders > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {analytics.ecommerce.totalOrders}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {analytics?.goalMetrics && analytics.goalMetrics.length > 0 && (
              <TabsTrigger value="goals" className="relative">
                🎯 Metas
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {analytics.goalMetrics.length}
                </Badge>
              </TabsTrigger>
            )}
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

          <TabsContent value="ecommerce">
            <EcommerceTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="goals">
            {analytics?.goalMetrics && (
              <ConversionGoalsTab goalMetrics={analytics.goalMetrics} />
            )}
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
