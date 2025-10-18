import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Users, LayoutDashboard, Globe, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewCards } from "@/components/rank-rent/OverviewCards";
import { SitesList } from "@/components/rank-rent/SitesList";
import { AddSiteDialog } from "@/components/rank-rent/AddSiteDialog";
import { ClientsList } from "@/components/rank-rent/ClientsList";
import { GlobalFinancialOverview } from "@/components/rank-rent/financial/GlobalFinancialOverview";
import { GlobalFinancialTable } from "@/components/rank-rent/financial/GlobalFinancialTable";
import { GlobalCostSettings } from "@/components/rank-rent/financial/GlobalCostSettings";
import { PaymentAlerts } from "@/components/rank-rent/financial/PaymentAlerts";
import { PaymentsList } from "@/components/rank-rent/financial/PaymentsList";
import { useGlobalFinancialMetrics } from "@/hooks/useGlobalFinancialMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { SuperAdminBanner } from "@/components/super-admin/SuperAdminBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BarChart3 } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSite, setShowAddSite] = useState(false);
  const navigate = useNavigate();
  const { role, isSuperAdmin, isEndClient, isLoading: roleLoading } = useRole();

  const { sitesMetrics, summary, isLoading: financialLoading } = useGlobalFinancialMetrics(user?.id || "");

  // Redirecionar apenas End Clients (Super Admin pode acessar tudo)
  useEffect(() => {
    if (!roleLoading && role) {
      if (isEndClient) {
        navigate("/end-client-portal");
        return;
      }
    }
  }, [role, isEndClient, roleLoading, navigate]);

  useEffect(() => {
    // 1. Configurar listener PRIMEIRO
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/");
      }
    });

    // 2. DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 to-accent/10">
      {isSuperAdmin && <SuperAdminBanner currentView="client" />}
      <Header showSubtitle={false} />
      <div className="flex-1">
        <div className="container mx-auto p-6 pb-20 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Dashboard do Cliente
              </h1>
              <p className="text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddSite(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Site
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sites" className="gap-2">
              <Globe className="w-4 h-4" />
              Sites
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewCards userId={user.id} />
            <SitesList userId={user.id} />
          </TabsContent>

          <TabsContent value="sites">
            <SitesList userId={user.id} />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <PaymentAlerts userId={user.id} />
            
            {financialLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="w-full max-w-2xl">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                  <TabsTrigger value="projects">Projetos</TabsTrigger>
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <GlobalFinancialOverview summary={summary} userId={user.id} />
                  <GlobalFinancialTable sitesMetrics={sitesMetrics} />
                </TabsContent>

                <TabsContent value="payments">
                  <PaymentsList userId={user.id} />
                </TabsContent>

                <TabsContent value="projects">
                  <GlobalFinancialTable sitesMetrics={sitesMetrics} />
                </TabsContent>

                <TabsContent value="settings">
                  <GlobalCostSettings userId={user.id} />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="clients">
            <ClientsList userId={user.id} />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <AddSiteDialog
        open={showAddSite}
        onOpenChange={setShowAddSite}
        userId={user.id}
      />
      <Footer />
    </div>
  );
};

export default Dashboard;
