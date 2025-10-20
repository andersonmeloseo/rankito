import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EndClientPortal = () => {
  const navigate = useNavigate();
  const { isEndClient, isSuperAdmin, isLoading, user } = useRole();
  const [periodDays, setPeriodDays] = useState(30);

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
      <Header showSubtitle={false} />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Portal Analítico Premium
                </h1>
                <p className="text-muted-foreground mt-2">
                  {endClientData?.clientName || user?.email}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
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
                
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
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
              totalConversions={analytics.totalConversions}
              conversionRate={analytics.conversionRate}
              monthlyRevenue={analytics.monthlyRevenue}
              pageViews={analytics.pageViews}
            />
          )}

          {/* Charts Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="pages">Páginas</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {analytics && (
                <ClientPortalCharts
                  dailyStats={analytics.dailyStats as any}
                  topPages={analytics.topPages as any}
                />
              )}
            </TabsContent>

            <TabsContent value="pages" className="space-y-6">
              {analytics && (
                <ClientPortalCharts
                  dailyStats={analytics.dailyStats as any}
                  topPages={analytics.topPages as any}
                />
              )}
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
