import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnalyticsMetricsCards } from '@/components/client-portal/AnalyticsMetricsCards';
import { ClientPortalCharts } from '@/components/client-portal/ClientPortalCharts';
import { SavedReportsSection } from '@/components/client-portal/SavedReportsSection';
import { LiveIndicator } from '@/components/client-portal/LiveIndicator';
import { RealtimeConversionsList } from '@/components/client-portal/RealtimeConversionsList';
import { ConversionToast } from '@/components/client-portal/ConversionToast';
import { RealtimeSettingsComponent, RealtimeSettings } from '@/components/client-portal/RealtimeSettings';
import { useClientPortalAnalytics } from '@/hooks/useClientPortalAnalytics';
import { useRealtimeConversions } from '@/hooks/useRealtimeConversions';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { Calendar, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function EnhancedClientPortal() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);
  const [realtimeSettings, setRealtimeSettings] = useState<RealtimeSettings>({
    realtimeEnabled: true,
    notificationsEnabled: true,
    soundEnabled: true,
    notifyOnPhone: true,
    notifyOnWhatsApp: true,
  });
  const [lastConversion, setLastConversion] = useState<any>(null);
  const realtimeTabRef = useRef<HTMLDivElement>(null);

  const { analytics, reports, isLoading } = useClientPortalAnalytics(
    clientData?.client_id || '',
    periodDays
  );

  // Buscar site IDs para realtime
  const { data: clientSites } = useQuery({
    queryKey: ['client-sites-public', clientData?.client_id],
    queryFn: async () => {
      if (!clientData?.client_id) return [];
      const { data } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('client_id', clientData.client_id)
        .eq('is_rented', true);
      return data?.map((s) => s.id) || [];
    },
    enabled: !!clientData?.client_id,
  });

  // Hook de realtime conversions
  const handleNewConversion = useCallback((conversion: any) => {
    if (!realtimeSettings.notificationsEnabled || !realtimeSettings.realtimeEnabled) return;
    
    const eventType = conversion.event_type.toLowerCase();
    const shouldNotify = 
      (eventType.includes('phone') && realtimeSettings.notifyOnPhone) ||
      (eventType.includes('whatsapp') && realtimeSettings.notifyOnWhatsApp);
    
    if (shouldNotify) {
      setLastConversion(conversion);
    }
  }, [realtimeSettings]);

  const {
    newConversions,
    liveCount,
    isConnected,
    totalConversionsToday,
    clearNewConversions,
  } = useRealtimeConversions(
    realtimeSettings.realtimeEnabled ? clientSites : undefined,
    handleNewConversion
  );

  const liveMetrics = useRealtimeMetrics(analytics, newConversions);

  const scrollToRealtime = useCallback(() => {
    realtimeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadPortalData();
  }, [token]);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Buscando portal com token:', token);
      
      // Fetch portal data
      const { data: portalData, error: portalError } = await supabase
        .from('client_portal_analytics')
        .select('*, rank_rent_clients(*)')
        .eq('portal_token', token)
        .eq('enabled', true)
        .maybeSingle();

      console.log('📊 Dados do portal:', portalData);
      console.log('❌ Erro do portal:', portalError);

      if (portalError) {
        console.error('Erro ao buscar portal:', portalError);
        throw portalError;
      }

      if (!portalData) {
        console.error('Portal não encontrado ou desabilitado');
        throw new Error('Portal não encontrado');
      }

      setClientData(portalData);
    } catch (error) {
      console.error('Error loading portal:', error);
      setLoading(false);
      // Não redirecionar imediatamente, mostrar mensagem de erro
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!loading && !clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold mb-4">Portal não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O link que você acessou é inválido, foi desabilitado ou o portal não está configurado.
          </p>
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-w-md mx-auto">
            <p className="font-medium mb-2">Para o administrador:</p>
            <ul className="text-left space-y-1">
              <li>• Verifique se o portal está habilitado</li>
              <li>• Confirme se o token está correto</li>
              <li>• Gere um novo link se necessário</li>
            </ul>
          </div>
          <Button onClick={() => navigate('/')}>Ir para Home</Button>
        </div>
      </div>
    );
  }

  const clientName = clientData.rank_rent_clients?.name || 'Cliente';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary/70 text-white p-8 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bem-vindo, {clientName}! 👋</h1>
              <p className="text-white/90">Acompanhe o desempenho dos seus sites em tempo real</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <LiveIndicator 
                isConnected={isConnected} 
                liveCount={liveCount}
                onViewNew={scrollToRealtime}
              />
              
              <Select value={periodDays.toString()} onValueChange={(v) => setPeriodDays(Number(v))}>
                <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate('/')}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        {analytics && (
          <AnalyticsMetricsCards
            totalSites={analytics.totalSites}
            totalPages={analytics.totalPages}
            totalConversions={liveMetrics.totalConversions}
            conversionRate={liveMetrics.conversionRate}
            monthlyRevenue={analytics.monthlyRevenue}
            pageViews={analytics.pageViews}
            liveMetrics={liveMetrics}
          />
        )}
        
        {/* Conversion Toast */}
        <ConversionToast 
          conversion={lastConversion}
          soundEnabled={realtimeSettings.soundEnabled}
        />

        {/* Tabs with Realtime */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[700px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="realtime">
              Tempo Real
              {liveCount > 0 && (
                <Badge variant="default" className="ml-2 bg-green-600">
                  {liveCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analytics && (
              <ClientPortalCharts
                dailyStats={analytics.dailyStats}
                topPages={analytics.topPages}
                liveData={newConversions}
              />
            )}
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6" ref={realtimeTabRef}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <RealtimeSettingsComponent onSettingsChange={setRealtimeSettings} />
              <div className="lg:col-span-2">
                <RealtimeConversionsList conversions={newConversions} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <SavedReportsSection reports={reports || []} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
