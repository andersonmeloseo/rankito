import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, Globe, DollarSign, UserCircle, KeyRound, Shield, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { OverviewDashboard } from "@/components/super-admin/OverviewDashboard";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { UsersManagementTable } from "@/components/super-admin/UsersManagementTable";
import { SubscriptionMetricsCards } from "@/components/super-admin/SubscriptionMetricsCards";
import { PlansManagementTable } from "@/components/super-admin/PlansManagementTable";
import { SubscriptionsTable } from "@/components/super-admin/SubscriptionsTable";
import { PaymentsHistoryTable } from "@/components/super-admin/PaymentsHistoryTable";
import { ResetUserPasswordDialog } from "@/components/super-admin/ResetUserPasswordDialog";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading, user } = useRole();
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [isSuperAdmin, isLoading, navigate]);


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
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0">
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
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <OverviewDashboard />
            </TabsContent>

            <TabsContent value="users" className="space-y-8">
              <Card className="shadow-card hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle>Gestão de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie todos os usuários do SaaS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsersManagementTable />
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
