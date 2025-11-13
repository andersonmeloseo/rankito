import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useRole } from "@/contexts/RoleContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Users, LayoutDashboard, Globe, DollarSign, Briefcase, Settings, ChevronDown, Home, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CRMHub } from "@/components/crm/CRMHub";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewCards } from "@/components/rank-rent/OverviewCards";
import { SitesList } from "@/components/rank-rent/SitesList";
import { AddSiteDialog } from "@/components/rank-rent/AddSiteDialog";
import { ClientsListIntegrated } from "@/components/rank-rent/ClientsListIntegrated";
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
import { PlanUsageCard } from "@/components/subscription/PlanUsageCard";
import { LimitWarningBanner } from "@/components/subscription/LimitWarningBanner";
import { SubscriptionStatusBar } from "@/components/subscription/SubscriptionStatusBar";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Badge } from "@/components/ui/badge";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";
import { useViewMode } from "@/hooks/useViewMode";
import { BulkActionsBar } from "@/components/layout/BulkActionsBar";
import { BulkRentDialog } from "@/components/rank-rent/BulkRentDialog";
import { BulkDeleteDialog } from "@/components/rank-rent/BulkDeleteDialog";

import { LeadNotificationBanner } from "@/components/crm/LeadNotificationBanner";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSite, setShowAddSite] = useState(false);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, isSuperAdmin, isEndClient, isLoading: roleLoading } = useRole();
  const { viewMode, setViewMode } = useViewMode("sites-view", "table");

  // Realtime leads
  const { newLeads, clearNewLeads } = useRealtimeLeads(user?.id);

  // Subscription limits
  const { data: limits, isLoading: limitsLoading } = useSubscriptionLimits();

  const { sitesMetrics, summary, isLoading: financialLoading } = useGlobalFinancialMetrics(user?.id || "");

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

  const userName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Usuário";

  // Detectar se é visita recorrente
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const lastVisit = localStorage.getItem(`lastVisit_${user.id}`);
      setIsReturningUser(!!lastVisit);
      localStorage.setItem(`lastVisit_${user.id}`, new Date().toISOString());
    }
  }, [user?.id]);

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

  const handleSelectSite = (siteId: string) => {
    setSelectedSites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  };

  const [showBulkRentDialog, setShowBulkRentDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Fetch sites for bulk operations
  const { data: allSites } = useQuery({
    queryKey: ["rank-rent-site-metrics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_site_metrics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const selectedSitesData = allSites?.filter(site => selectedSites.has(site.id)) || [];

  const handleClearSelection = () => {
    setSelectedSites(new Set());
  };

  const handleSelectAll = (filteredSiteIds: string[]) => {
    if (filteredSiteIds.every(id => selectedSites.has(id))) {
      // Deselect all filtered
      setSelectedSites(new Set([...selectedSites].filter(id => !filteredSiteIds.includes(id))));
    } else {
      // Select all filtered
      setSelectedSites(new Set([...selectedSites, ...filteredSiteIds]));
    }
  };

  const handleBulkRent = () => {
    if (selectedSites.size === 0) {
      toast({
        title: "Nenhum projeto selecionado",
        description: "Selecione pelo menos um projeto para alugar",
        variant: "destructive",
      });
      return;
    }
    setShowBulkRentDialog(true);
  };

  const handleBulkIndex = async () => {
    if (selectedSites.size === 0) {
      toast({
        title: "Nenhum projeto selecionado",
        description: "Selecione pelo menos um projeto para indexar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "🔄 Indexação em massa",
      description: `Iniciando indexação de ${selectedSites.size} projeto(s). As páginas serão adicionadas à fila GSC.`,
    });

    // TODO: Implementar integração com GSC batch indexing
    // Por enquanto apenas mostra feedback visual
  };

  const handleBulkArchive = async () => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de arquivamento em lote será implementada em breve",
    });
  };

  const handleBulkExport = () => {
    if (selectedSites.size === 0) {
      toast({
        title: "Nenhum projeto selecionado",
        description: "Selecione pelo menos um projeto para exportar",
        variant: "destructive",
      });
      return;
    }

    const { exportSitesToExcel } = require("@/utils/exportHelpers");
    exportSitesToExcel(selectedSitesData);
    
    toast({
      title: "✅ Exportação concluída",
      description: `${selectedSites.size} projeto(s) exportado(s) para Excel`,
    });
  };

  const handleBulkDelete = () => {
    if (selectedSites.size === 0) {
      toast({
        title: "Nenhum projeto selecionado",
        description: "Selecione pelo menos um projeto para excluir",
        variant: "destructive",
      });
      return;
    }
    setShowBulkDeleteDialog(true);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-primary/10">
      {isSuperAdmin && <SuperAdminBanner currentView="client" />}
      <LeadNotificationBanner leads={newLeads} onDismiss={clearNewLeads} />
      <Header showSubtitle={false} />
      <div className="flex-1">
        <div className="container mx-auto py-8 pb-64 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" />
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <div>
                <h1 className="text-2xl font-bold">
                  Dashboard de Gestão de Rank & Rent
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isReturningUser ? "Seja bem-vindo de volta" : "Seja bem-vindo"} {userName} ({user?.email})
                </p>
              </div>
              
              {/* Barra de status de limites */}
              <div className="mt-3">
                <SubscriptionStatusBar compact />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                onClick={() => setShowAddSite(true)} 
                className="gap-2 relative"
                disabled={!limits?.canCreateSite}
              >
                <Plus className="w-4 h-4" />
                Adicionar Site
                
                {/* Badge com sites disponíveis */}
                {limits && !limits.isUnlimited && limits.remainingSites !== null && (
                  <Badge 
                    variant={limits.remainingSites <= 2 ? "destructive" : "secondary"}
                    className="ml-2 text-xs"
                  >
                    {limits.remainingSites > 0 
                      ? `+${limits.remainingSites}` 
                      : '0'
                    }
                  </Badge>
                )}
                
                {/* Badge para planos ilimitados */}
                {limits?.isUnlimited && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    ∞
                  </Badge>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 h-auto py-2 px-3 hover:bg-muted hover:text-foreground"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block font-medium">
                      {profile?.full_name || userName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex items-center gap-3 p-3 border-b">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{profile?.full_name || userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="p-1">
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                      <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Sair da conta</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="border-b border-border/50 bg-muted/30">
            <TabsList className="h-12 bg-transparent w-full max-w-5xl justify-start gap-1">
              <TabsTrigger 
                value="overview" 
                className="relative gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-sm hover:scale-105 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/70 data-[state=active]:to-primary/50 data-[state=active]:shadow-lg transition-all duration-300 ease-out group"
              >
                <LayoutDashboard className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                <span className="relative z-10">Overview</span>
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out shadow-[0_2px_8px_hsl(var(--primary)/0.5)] group-data-[state=active]:shadow-[0_2px_12px_hsl(var(--primary)/0.8)]" />
              </TabsTrigger>
              <TabsTrigger 
                value="sites"
                className="relative gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-sm hover:scale-105 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/70 data-[state=active]:to-primary/50 data-[state=active]:shadow-lg transition-all duration-300 ease-out group"
              >
                <Globe className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                <span className="relative z-10">Sites</span>
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out shadow-[0_2px_8px_hsl(var(--primary)/0.5)] group-data-[state=active]:shadow-[0_2px_12px_hsl(var(--primary)/0.8)]" />
              </TabsTrigger>
              <TabsTrigger 
                value="crm"
                className="relative gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-sm hover:scale-105 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/70 data-[state=active]:to-primary/50 data-[state=active]:shadow-lg transition-all duration-300 ease-out group"
              >
                <Briefcase className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                <span className="relative z-10">CRM</span>
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out shadow-[0_2px_8px_hsl(var(--primary)/0.5)] group-data-[state=active]:shadow-[0_2px_12px_hsl(var(--primary)/0.8)]" />
              </TabsTrigger>
              <TabsTrigger 
                value="financial"
                className="relative gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-sm hover:scale-105 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/70 data-[state=active]:to-primary/50 data-[state=active]:shadow-lg transition-all duration-300 ease-out group"
              >
                <DollarSign className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                <span className="relative z-10">Financeiro</span>
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out shadow-[0_2px_8px_hsl(var(--primary)/0.5)] group-data-[state=active]:shadow-[0_2px_12px_hsl(var(--primary)/0.8)]" />
              </TabsTrigger>
              <TabsTrigger 
                value="clients"
                className="relative gap-2 px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-sm hover:scale-105 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/70 data-[state=active]:to-primary/50 data-[state=active]:shadow-lg transition-all duration-300 ease-out group"
              >
                <Users className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                <span className="relative z-10">Clientes</span>
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out shadow-[0_2px_8px_hsl(var(--primary)/0.5)] group-data-[state=active]:shadow-[0_2px_12px_hsl(var(--primary)/0.8)]" />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <LimitWarningBanner />
            <OverviewCards userId={user.id} />
            <SitesList userId={user.id} />
          </TabsContent>

          <TabsContent value="sites" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Meus Projetos</h2>
              <ViewSwitcher value={viewMode} onValueChange={setViewMode} />
            </div>
            <SitesList 
              userId={user.id} 
              viewMode={viewMode}
              selectedSites={selectedSites}
              onSelectSite={handleSelectSite}
            />
          </TabsContent>

          <BulkActionsBar
            selectedCount={selectedSites.size}
            totalCount={allSites?.length || 0}
            onSelectAll={() => handleSelectAll(allSites?.map(s => s.id) || [])}
            onClearSelection={handleClearSelection}
            onRent={handleBulkRent}
            onIndex={handleBulkIndex}
            onArchive={handleBulkArchive}
            onExport={handleBulkExport}
            onDelete={handleBulkDelete}
          />

          <TabsContent value="crm">
            <CRMHub userId={user.id} />
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
            <ClientsListIntegrated userId={user.id} />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <AddSiteDialog
        open={showAddSite}
        onOpenChange={setShowAddSite}
        userId={user.id}
      />
      
      <BulkRentDialog
        open={showBulkRentDialog}
        onOpenChange={setShowBulkRentDialog}
        siteIds={Array.from(selectedSites)}
        siteNames={selectedSitesData.map(s => s.site_name)}
        onComplete={handleClearSelection}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        siteIds={Array.from(selectedSites)}
        siteNames={selectedSitesData.map(s => s.site_name)}
        onComplete={handleClearSelection}
      />
      
      <Footer />
    </div>
  );
};

export default Dashboard;
