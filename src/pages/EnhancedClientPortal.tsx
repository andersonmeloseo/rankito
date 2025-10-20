import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsMetricsCards } from '@/components/client-portal/AnalyticsMetricsCards';
import { ClientPortalCharts } from '@/components/client-portal/ClientPortalCharts';
import { SavedReportsSection } from '@/components/client-portal/SavedReportsSection';
import { useClientPortalAnalytics } from '@/hooks/useClientPortalAnalytics';
import { Calendar, LogOut } from 'lucide-react';

export default function EnhancedClientPortal() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(30);

  const { analytics, reports, isLoading } = useClientPortalAnalytics(
    clientData?.client_id || '',
    periodDays
  );

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
      
      // Fetch portal data
      const { data: portalData, error: portalError } = await supabase
        .from('client_portal_analytics')
        .select('*, rank_rent_clients(*)')
        .eq('portal_token', token)
        .eq('enabled', true)
        .single();

      if (portalError) throw portalError;

      setClientData(portalData);
    } catch (error) {
      console.error('Error loading portal:', error);
      navigate('/');
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

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Portal não encontrado</h1>
          <p className="text-muted-foreground mb-6">O link que você acessou é inválido ou expirou.</p>
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
              <h1 className="text-3xl font-bold mb-2">Bem-vindo, {clientName}!</h1>
              <p className="text-white/90">Acompanhe o desempenho dos seus sites em tempo real</p>
            </div>
            <div className="flex items-center gap-4">
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
            totalConversions={analytics.totalConversions}
            conversionRate={analytics.conversionRate}
            monthlyRevenue={analytics.monthlyRevenue}
            pageViews={analytics.pageViews}
          />
        )}

        {/* Charts */}
        {analytics && (
          <ClientPortalCharts
            dailyStats={analytics.dailyStats}
            topPages={analytics.topPages}
          />
        )}

        {/* Saved Reports */}
        <SavedReportsSection reports={reports || []} />
      </main>

      <Footer />
    </div>
  );
}
