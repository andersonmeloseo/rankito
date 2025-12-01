import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Users, LayoutDashboard, Globe, DollarSign, Briefcase, Home, ShoppingCart, MapPin, MessageCircle, GraduationCap, Rocket } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CRMHub } from "@/components/crm/CRMHub";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ClickUpTabTrigger } from "@/components/ui/custom-tabs";
import { OverviewCards } from "@/components/rank-rent/OverviewCards";
import { OverviewCRMSummary } from "@/components/dashboard/OverviewCRMSummary";
import { OverviewFinancialSummary } from "@/components/dashboard/OverviewFinancialSummary";
import { TopProjectsPerformance } from "@/components/dashboard/TopProjectsPerformance";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickAlerts } from "@/components/dashboard/QuickAlerts";
import { SitesList } from "@/components/rank-rent/SitesList";
import { AddSiteDialog } from "@/components/rank-rent/AddSiteDialog";
import { ClientsListIntegrated } from "@/components/rank-rent/ClientsListIntegrated";
import { GlobalFinancialOverview } from "@/components/rank-rent/financial/GlobalFinancialOverview";
import { GlobalFinancialTable } from "@/components/rank-rent/financial/GlobalFinancialTable";
import { GlobalCostSettings } from "@/components/rank-rent/financial/GlobalCostSettings";
import { PaymentAlerts } from "@/components/rank-rent/financial/PaymentAlerts";
import { PaymentsList } from "@/components/rank-rent/financial/PaymentsList";
import { useGlobalFinancialMetrics } from "@/hooks/useGlobalFinancialMetrics";
import { useGlobalEcommerceMetrics } from "@/hooks/useGlobalEcommerceMetrics";
import { EcommerceOverviewCards } from "@/components/dashboard/EcommerceOverviewCards";
import { TopProjectsByRevenue } from "@/components/dashboard/TopProjectsByRevenue";
import { RevenueEvolutionChart } from "@/components/dashboard/RevenueEvolutionChart";
import { EcommerceTab } from "@/components/dashboard/ecommerce/EcommerceTab";
import { Skeleton } from "@/components/ui/skeleton";
import { SuperAdminBanner } from "@/components/super-admin/SuperAdminBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PlanUsageCard } from "@/components/subscription/PlanUsageCard";
import { LimitWarningBanner } from "@/components/subscription/LimitWarningBanner";
import { SubscriptionStatusBar } from "@/components/subscription/SubscriptionStatusBar";
import { TrialExpiredBanner } from "@/components/subscription/TrialExpiredBanner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Badge } from "@/components/ui/badge";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";
import { useViewMode } from "@/hooks/useViewMode";
import { BulkActionsBar } from "@/components/layout/BulkActionsBar";
import { BulkRentDialog } from "@/components/rank-rent/BulkRentDialog";
import { BulkDeleteDialog } from "@/components/rank-rent/BulkDeleteDialog";

import { LeadNotificationBanner } from "@/components/crm/LeadNotificationBanner";
import { useRealtimeLeads } from "@/hooks/useRealtimeLeads";
import { GeolocationAnalyticsTab } from "@/components/dashboard/geolocation/GeolocationAnalyticsTab";
import { useUnreadCommunications } from "@/hooks/useUnreadCommunications";
import { CommunicationNotificationBadge } from "@/components/dashboard/CommunicationNotificationBadge";
import { UserCommunicationsTab } from "@/components/dashboard/UserCommunicationsTab";
import { AcademyTab } from "@/components/training/AcademyTab";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { CompleteTutorialModal } from "@/components/onboarding/CompleteTutorialModal";
import { PublicRoadmapTab } from "@/components/backlog/user/PublicRoadmapTab";

const Dashboard = () => {
  const [showAddSite, setShowAddSite] = useState(false);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { role, isSuperAdmin, isEndClient, isLoading: roleLoading, user } = useRole();
  const { viewMode, setViewMode } = useViewMode("sites-view", "table");
  const { restartOnboarding } = useOnboarding();
  const [showCompleteTutorial, setShowCompleteTutorial] = useState(false);

  // Handle tab changes with URL sync
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  // Realtime leads
  const { newLeads, clearNewLeads } = useRealtimeLeads(user?.id);

  // Unread communications
  const { data: unreadData } = useUnreadCommunications(user?.id);
  const unreadCount = unreadData?.count || 0;

  // Subscription limits
  const { data: limits, isLoading: limitsLoading } = useSubscriptionLimits();

  const { sitesMetrics, summary, isLoading: financialLoading } = useGlobalFinancialMetrics(user?.id || "");

  // Global e-commerce metrics
  const { data: ecommerceMetrics, isLoading: ecommerceLoading } = useGlobalEcommerceMetrics(user?.id);

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

  // State sync happens automatically through controlled Tabs component

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

  // Handle onboarding actions
  const handleOnboardingAction = (action: string) => {
    switch (action) {
      case "add-site":
        setShowAddSite(true);
        break;
      case "setup-gsc":
        // Navigate to first site's GSC tab if exists, otherwise create site
        if (allSites && allSites.length > 0) {
          navigate(`/dashboard/site/${allSites[0].id}?tab=gsc`);
        } else {
          setShowAddSite(true);
        }
        break;
      case "view-tracking":
        // Navigate to Academia tab where tracking instructions are available
        handleTabChange("academia");
        break;
      case "download-plugin":
        // Navigate to integrations tab where WordPress plugin download is available
        handleTabChange("integrações");
        break;
      case "add-client":
        // Navigate to clients tab to add new clients
        handleTabChange("clients");
        break;
    }
  };

  if (roleLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Onboarding Tour */}
      <OnboardingTour onAction={handleOnboardingAction} />
      
      {/* Complete Tutorial Modal */}
      <CompleteTutorialModal 
        open={showCompleteTutorial} 
        onOpenChange={setShowCompleteTutorial}
      />
      
      {isSuperAdmin && <SuperAdminBanner currentView="client" />}
      
      {/* Trial Expired Banner */}
      <TrialExpiredBanner />
      
      {/* Lead Notifications Banner */}
      {newLeads.length > 0 && (
        <div className="border-b border-warning/20 bg-warning/5">
          <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-3">
            <LeadNotificationBanner leads={newLeads} onDismiss={clearNewLeads} />
          </div>
        </div>
      )}
      
      <Header showSubtitle={false} />
      
      {/* Hero Section */}
      <div className="border-b border-border/50 bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-8">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5">
                  <Home className="w-4 h-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Title + Action */}
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <div className="flex items-center gap-3">
                <p className="text-base text-muted-foreground">
                  Bem-vindo de volta, {userName} 👋
                </p>
                {unreadCount > 0 && (
                  <CommunicationNotificationBadge 
                    count={unreadCount}
                    onClick={() => handleTabChange('communication')}
                  />
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowCompleteTutorial(true)}
                className="gap-2"
              >
                <Rocket className="w-4 h-4" />
                Tutorial
              </Button>
              
              <Button 
                size="lg"
                onClick={() => setShowAddSite(true)} 
                className="gap-2 transition-all hover:scale-105 hover:shadow-lg"
                disabled={!limits?.canCreateSite}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Adicionar Projeto</span>
              
                {/* Badge dinâmico com quota */}
                {limits && !limits.isUnlimited && limits.remainingSites !== null && (
                  <Badge 
                    variant={limits.remainingSites <= 2 ? "destructive" : "default"}
                    className={limits.remainingSites <= 2 ? "animate-pulse" : ""}
                  >
                    +{limits.remainingSites > 0 ? limits.remainingSites : 0}
                  </Badge>
                )}
                
                {limits?.isUnlimited && (
                  <Badge variant="default">∞</Badge>
                )}
              </Button>
            </div>
          </div>
          
          {/* Subscription Status */}
          <SubscriptionStatusBar compact />
        </div>
      </div>
      
      <div className="flex-1">
        <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-8 space-y-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
            <div className="border-b border-gray-200">
              <div className="container mx-auto px-4 lg:px-8 xl:px-12">
                <TabsList className="bg-transparent w-full justify-start gap-1 h-auto p-0">
                  <ClickUpTabTrigger value="overview" icon={LayoutDashboard}>
                    Overview
                  </ClickUpTabTrigger>
                  
            <ClickUpTabTrigger value="sites" icon={Globe}>
              Projetos
            </ClickUpTabTrigger>
            
            <ClickUpTabTrigger value="crm" icon={Briefcase}>
              CRM
            </ClickUpTabTrigger>
                  
                  <ClickUpTabTrigger value="financial" icon={DollarSign}>
                    Financeiro
                  </ClickUpTabTrigger>
                  
                  <ClickUpTabTrigger value="ecommerce" icon={ShoppingCart}>
                    E-commerce
                  </ClickUpTabTrigger>
                  
                  <ClickUpTabTrigger value="geolocation" icon={MapPin}>
                    Geolocalização
                  </ClickUpTabTrigger>
                  
                  <ClickUpTabTrigger value="clients" icon={Users}>
                    Clientes
                  </ClickUpTabTrigger>

                  <ClickUpTabTrigger value="communication" icon={MessageCircle}>
                    Suporte
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 animate-pulse">
                        {unreadCount}
                      </Badge>
                    )}
                  </ClickUpTabTrigger>

            <ClickUpTabTrigger value="academia" icon={GraduationCap}>
              Academia
            </ClickUpTabTrigger>
            <ClickUpTabTrigger value="atualizacoes" icon={Rocket}>
              Atualizações
            </ClickUpTabTrigger>
          </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-8">
              {limitsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  <OverviewCards userId={user.id} />
                  
                  {/* E-commerce Overview Cards */}
                  <EcommerceOverviewCards
                    totalRevenue={ecommerceMetrics?.totalRevenue || 0}
                    globalAOV={ecommerceMetrics?.globalAOV || 0}
                    activeSites={ecommerceMetrics?.activeSites || 0}
                    totalSites={allSites?.length || 0}
                    totalOrders={ecommerceMetrics?.totalOrders || 0}
                    isLoading={ecommerceLoading}
                  />
                  
                  {/* E-commerce Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueEvolutionChart 
                      data={ecommerceMetrics?.revenueEvolution || []}
                      isLoading={ecommerceLoading}
                    />
                    <TopProjectsByRevenue 
                      projects={ecommerceMetrics?.topProjects || []}
                      isLoading={ecommerceLoading}
                    />
                  </div>
                  
                  {/* CRM & Financial Summaries */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <OverviewCRMSummary userId={user.id} />
                    <OverviewFinancialSummary userId={user.id} />
                  </div>
                  
                  {/* Top Projects Performance */}
                  <TopProjectsPerformance userId={user.id} />
                  
                  {/* Recent Activity */}
                  <RecentActivity userId={user.id} />
                  
                  {/* Quick Alerts */}
                  <QuickAlerts userId={user.id} />
                </>
              )}
            </TabsContent>

            <TabsContent value="sites" className="space-y-8">
              {/* View Switcher */}
              <div className="flex justify-end">
                <ViewSwitcher value={viewMode} onValueChange={setViewMode} />
              </div>

              {/* Bulk Actions Bar */}
              {selectedSites.size > 0 && (
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
              )}

              <SitesList 
                userId={user.id} 
                viewMode={viewMode}
                selectedSites={selectedSites}
                onSelectSite={handleSelectSite}
              />
            </TabsContent>

            <TabsContent value="crm" className="space-y-8">
              <CRMHub userId={user.id} />
            </TabsContent>

            <TabsContent value="financial" className="space-y-8">
              <PaymentAlerts userId={user.id} />
              <GlobalFinancialOverview summary={summary} userId={user.id} />
              <GlobalFinancialTable sitesMetrics={sitesMetrics} />
              <GlobalCostSettings userId={user.id} />
              <PaymentsList userId={user.id} />
            </TabsContent>

            <TabsContent value="ecommerce" className="space-y-8">
              <EcommerceTab />
            </TabsContent>

            <TabsContent value="geolocation" className="space-y-8">
              <GeolocationAnalyticsTab userId={user.id} />
            </TabsContent>

            <TabsContent value="clients" className="space-y-8">
              <ClientsListIntegrated userId={user.id} />
            </TabsContent>

            <TabsContent value="communication" className="space-y-8">
              <UserCommunicationsTab />
            </TabsContent>

            <TabsContent value="academia" className="space-y-8">
              <AcademyTab />
            </TabsContent>

            <TabsContent value="atualizacoes" className="space-y-8">
              <PublicRoadmapTab />
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
