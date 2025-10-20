import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRole } from "@/contexts/RoleContext";
import { SuperAdminBanner } from "@/components/super-admin/SuperAdminBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useEndClientData } from "@/hooks/useEndClientData";
import { useClientPortalAnalytics } from "@/hooks/useClientPortalAnalytics";
import { AnalyticsMetricsCards } from "@/components/client-portal/AnalyticsMetricsCards";
import { ClientPortalCharts } from "@/components/client-portal/ClientPortalCharts";
import { SavedReportsSection } from "@/components/client-portal/SavedReportsSection";
import { ClientFinancialSection } from "@/components/client-portal/ClientFinancialSection";
import { LiveIndicator } from "@/components/client-portal/LiveIndicator";
import { RealtimeConversionsList } from "@/components/client-portal/RealtimeConversionsList";
import { ConversionToast } from "@/components/client-portal/ConversionToast";
import { RealtimeSettingsComponent, RealtimeSettings } from "@/components/client-portal/RealtimeSettings";
import { useRealtimeConversions } from "@/hooks/useRealtimeConversions";
import { useRealtimeMetrics } from "@/hooks/useRealtimeMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useClientFinancials } from "@/hooks/useClientFinancials";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/hooks/useUserProfile";
import { useQuery } from "@tanstack/react-query";

const EndClientPortal = () => {
  const navigate = useNavigate();
  const { isEndClient, isSuperAdmin, isLoading, user } = useRole();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    if (!isLoading && !isEndClient && !isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isEndClient, isSuperAdmin, isLoading, navigate]);

  const { data: endClientData, isLoading: endClientLoading } = useEndClientData(user?.id);
  
  const { analytics, reports, isLoading: analyticsLoading } = useClientPortalAnalytics(
    endClientData?.clientId || '', 
    periodDays
  );

  const { data: financialData } = useClientFinancials(endClientData?.clientId || null, periodDays);

  // Buscar site IDs para realtime
  const { data: clientSites } = useQuery({
    queryKey: ['client-sites', endClientData?.clientId],
    queryFn: async () => {
      if (!endClientData?.clientId) return [];
      const { data } = await supabase
        .from('rank_rent_sites')
        .select('id')
        .eq('client_id', endClientData.clientId)
        .eq('is_rented', true);
      return data?.map((s) => s.id) || [];
    },
    enabled: !!endClientData?.clientId,
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

  // Buscar perfil completo do usuário
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (isLoading || endClientLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando seus dados analíticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {isSuperAdmin && <SuperAdminBanner currentView="end_client" />}
      <Header showSubtitle={true} />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {getGreeting()}, {endClientData?.userName || 'Cliente'}! 👋
                </h1>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-lg font-medium text-muted-foreground">
                    {endClientData?.clientCompany || endClientData?.clientName}
                  </p>
                  {endClientData?.clientEmail && (
                    <p className="text-sm text-muted-foreground/80">
                      {endClientData.clientEmail}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <LiveIndicator 
                  isConnected={isConnected} 
                  liveCount={liveCount}
                  onViewNew={scrollToRealtime}
                />
                
                <Select value={periodDays.toString()} onValueChange={(v) => setPeriodDays(Number(v))}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                        <AvatarFallback>
                          {getInitials(profile?.full_name || endClientData?.userName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Metrics Cards */}
          {analytics && (
            <AnalyticsMetricsCards
              totalSites={analytics.totalSites}
              totalPages={analytics.totalPages}
              totalConversions={liveMetrics.totalConversions}
              conversionRate={liveMetrics.conversionRate}
              monthlyRevenue={analytics.monthlyRevenue}
              pageViews={analytics.pageViews}
              clientId={endClientData?.clientId}
              liveMetrics={liveMetrics}
            />
          )}
          
          {/* Conversion Toast */}
          <ConversionToast 
            conversion={lastConversion}
            soundEnabled={realtimeSettings.soundEnabled}
          />

          {/* Charts Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="pages">Páginas</TabsTrigger>
              <TabsTrigger value="realtime">
                Tempo Real
                {liveCount > 0 && (
                  <Badge variant="default" className="ml-2 bg-green-600">
                    {liveCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="financial">
                Financeiro
                {financialData?.summary.overdueCount ? (
                  <Badge variant="destructive" className="ml-2">
                    {financialData.summary.overdueCount}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {analytics && (
                <ClientPortalCharts
                  dailyStats={analytics.dailyStats as any}
                  topPages={analytics.topPages as any}
                  liveData={newConversions}
                />
              )}
            </TabsContent>

            <TabsContent value="pages" className="space-y-6">
              {analytics && (
                <ClientPortalCharts
                  dailyStats={analytics.dailyStats as any}
                  topPages={analytics.topPages as any}
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

            <TabsContent value="financial" className="space-y-6">
              <ClientFinancialSection 
                clientId={endClientData?.clientId || null} 
                periodDays={periodDays}
              />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <SavedReportsSection reports={reports || []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EndClientPortal;
