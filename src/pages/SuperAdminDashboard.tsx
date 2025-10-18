import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, Users, Globe, DollarSign, Eye, UserCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { UserManagement } from "@/components/super-admin/UserManagement";
import { OverviewDashboard } from "@/components/super-admin/OverviewDashboard";
import { UsersManagementTable } from "@/components/super-admin/UsersManagementTable";
import { SubscriptionMetricsCards } from "@/components/super-admin/SubscriptionMetricsCards";
import { PlansManagementTable } from "@/components/super-admin/PlansManagementTable";
import { SubscriptionsTable } from "@/components/super-admin/SubscriptionsTable";
import { PaymentsHistoryTable } from "@/components/super-admin/PaymentsHistoryTable";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading, user } = useRole();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Ver como Cliente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/end-client-portal")}
              className="gap-2"
            >
              <UserCircle className="h-4 w-4" />
              Ver Portal End Client
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white/50 backdrop-blur">
            <TabsTrigger value="overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="mr-2 h-4 w-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewDashboard />
          </TabsContent>

          <TabsContent value="users">
            <Card>
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

          <TabsContent value="financial">
            <div className="space-y-6">
              <SubscriptionMetricsCards />
              <PlansManagementTable />
              <SubscriptionsTable />
              <PaymentsHistoryTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
