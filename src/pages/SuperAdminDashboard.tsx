import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, Globe, DollarSign, UserCircle, KeyRound, Shield, Package, Activity, TrendingUp, Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { OverviewDashboard } from "@/components/super-admin/OverviewDashboard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { UnifiedUsersTab } from "@/components/super-admin/UnifiedUsersTab";
import { SubscriptionMetricsCards } from "@/components/super-admin/SubscriptionMetricsCards";
import { PlansManagementTable } from "@/components/super-admin/PlansManagementTable";
import { SubscriptionsTable } from "@/components/super-admin/SubscriptionsTable";
import { PaymentsHistoryTable } from "@/components/super-admin/PaymentsHistoryTable";
import { ResetUserPasswordDialog } from "@/components/super-admin/ResetUserPasswordDialog";

import { GeolocationApisManager } from "@/components/super-admin/GeolocationApisManager";
import { AuditLogsTab } from "@/components/super-admin/AuditLogsTab";
import { useSystemHealthMetrics } from "@/hooks/useSystemHealthMetrics";
import { SystemHealthOverview } from "@/components/super-admin/SystemHealthOverview";
import { ProblematicIntegrationsTable } from "@/components/super-admin/ProblematicIntegrationsTable";
import { RecentIssuesTimeline } from "@/components/super-admin/RecentIssuesTimeline";
import { EdgeFunctionsHealthTable } from "@/components/super-admin/EdgeFunctionsHealthTable";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { RetentionAnalytics } from "@/components/super-admin/RetentionAnalytics";
import { AdminAutomationsTab } from "@/components/super-admin/automations/AdminAutomationsTab";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading, user } = useRole();
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const { data: healthMetrics, isLoading: isLoadingHealth } = useSystemHealthMetrics();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSubtitle={false} />
      
      <PageHeader
        breadcrumbs={[
          { label: "Super Admin", icon: Shield }
        ]}
        title="Super Admin Dashboard"
        subtitle={user?.email}
        actions={
          <>
            <NotificationCenter />
            <Button 
              variant="outline" 
              onClick={() => setResetPasswordOpen(true)}
              className="gap-2 transition-all active:scale-[0.98]"
            >
              <KeyRound className="h-4 w-4" />
              Resetar Senha
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="gap-2 transition-all active:scale-[0.98]"
            >
              <Globe className="h-4 w-4" />
              Ver como Cliente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/end-client-portal")}
              className="gap-2 transition-all active:scale-[0.98]"
            >
              <UserCircle className="h-4 w-4" />
              Ver Portal End Client
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="transition-all active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </>
        }
      />

      <div className="flex-1">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-8 pb-64 space-y-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-9 bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="users"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <Users className="mr-2 h-4 w-4" />
                Usuários
              </TabsTrigger>
              
              <TabsTrigger 
                value="geolocation-apis"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <Globe className="mr-2 h-4 w-4" />
                APIs
              </TabsTrigger>
              
              <TabsTrigger 
                value="plans"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <Package className="mr-2 h-4 w-4" />
                Gestão de Planos
              </TabsTrigger>
              
              <TabsTrigger 
                value="financial"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Financeiro
              </TabsTrigger>
              
              <TabsTrigger 
                value="audit-logs"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <Shield className="mr-2 h-4 w-4" />
                Logs de Auditoria
              </TabsTrigger>
              
              <TabsTrigger 
                value="retention"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Retenção
              </TabsTrigger>
              
              <TabsTrigger 
                value="automations"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <Bot className="mr-2 h-4 w-4" />
                Automações
              </TabsTrigger>
              
              <TabsTrigger 
                value="monitoring"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-gray-300 rounded-none border-b-2 border-transparent hover:bg-blue-500/10 hover:border-blue-400 transition-all"
              >
                <Activity className="mr-2 h-4 w-4" />
                Monitoramento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <OverviewDashboard />
            </TabsContent>

            <TabsContent value="users" className="space-y-8">
              <UnifiedUsersTab />
            </TabsContent>

            <TabsContent value="geolocation-apis" className="space-y-8">
              <Card className="shadow-card hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle>APIs de Geolocalização</CardTitle>
                  <CardDescription>
                    Gerencie as APIs de geolocalização para rastreamento de conversões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GeolocationApisManager />
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="plans" className="space-y-8">
            <PlansManagementTable />
          </TabsContent>

          <TabsContent value="financial" className="space-y-8">
            <SubscriptionMetricsCards />
            <SubscriptionsTable />
            <PaymentsHistoryTable />
          </TabsContent>

          <TabsContent value="audit-logs" className="space-y-8">
            <AuditLogsTab />
          </TabsContent>

                <TabsContent value="retention" className="space-y-8">
                  <RetentionAnalytics />
                </TabsContent>

                <TabsContent value="automations" className="space-y-8">
                  <AdminAutomationsTab />
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-8">
            {isLoadingHealth ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : healthMetrics ? (
              <>
                <SystemHealthOverview metrics={healthMetrics} />
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <ProblematicIntegrationsTable metrics={healthMetrics} />
                  <RecentIssuesTimeline metrics={healthMetrics} />
                </div>
                
                <EdgeFunctionsHealthTable metrics={healthMetrics} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Não foi possível carregar métricas de saúde</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
      <ResetUserPasswordDialog 
        open={resetPasswordOpen} 
        onOpenChange={setResetPasswordOpen} 
      />
    </div>
  );
};

export default SuperAdminDashboard;
