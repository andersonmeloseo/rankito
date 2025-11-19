import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ClickUpTabTrigger } from "@/components/ui/custom-tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, TrendingUp, Eye, MousePointerClick, DollarSign, Target, Calendar, Edit, Copy, Upload, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, RefreshCw, BarChart3, Clock, Trash2, Home, Globe, FileText, Search, Plug } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { EditPageDialog } from "@/components/rank-rent/EditPageDialog";
import { ImportSitemapDialog } from "@/components/rank-rent/ImportSitemapDialog";
import { DeleteSiteDialog } from "@/components/rank-rent/DeleteSiteDialog";
import { PluginDownloadCard } from "@/components/rank-rent/PluginDownloadCard";
import { PluginInstallationGuide } from "@/components/rank-rent/PluginInstallationGuide";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { TimelineChart } from "@/components/analytics/TimelineChart";
import { TopPagesChart } from "@/components/analytics/TopPagesChart";
import { EventsPieChart } from "@/components/analytics/EventsPieChart";
import { ConversionRateChart } from "@/components/analytics/ConversionRateChart";
import { ConversionFunnelChart } from "@/components/analytics/ConversionFunnelChart";
import { HourlyHeatmap } from "@/components/analytics/HourlyHeatmap";
import { PageViewsTimelineChart } from "@/components/analytics/PageViewsTimelineChart";
import { TopReferrersChart } from "@/components/analytics/TopReferrersChart";
import { PagePerformanceChart } from "@/components/analytics/PagePerformanceChart";
import { PageViewsTable } from "@/components/analytics/PageViewsTable";
import { ConversionsTimelineChart } from "@/components/analytics/ConversionsTimelineChart";
import { TopConversionPagesChart } from "@/components/analytics/TopConversionPagesChart";
import { ConversionTypeDistributionChart } from "@/components/analytics/ConversionTypeDistributionChart";
import { ConversionHeatmapChart } from "@/components/analytics/ConversionHeatmapChart";
import { TopPageViewsChart } from "@/components/analytics/TopPageViewsChart";
import { PageViewsDistributionChart } from "@/components/analytics/PageViewsDistributionChart";
import { PageViewsHeatmapChart } from "@/components/analytics/PageViewsHeatmapChart";
import { ConversionsTable } from "@/components/analytics/ConversionsTable";
import { useAnalytics } from "@/hooks/useAnalytics";
import { format, subDays } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReportsTab } from "@/components/reports/ReportsTab";
import { GSCIntegrationsManager } from "@/components/gsc/GSCIntegrationsManager";
import { GSCIntegrationHealthCard } from "@/components/gsc/GSCIntegrationHealthCard";
import { GSCIndexingAlertsPanel } from "@/components/gsc/GSCIndexingAlertsPanel";
import { GSCIndexingControls } from "@/components/gsc/GSCIndexingControls";
import { GSCDiscoveredUrlsTable } from "@/components/gsc/GSCDiscoveredUrlsTable";
import { GSCSearchAnalyticsDashboard } from "@/components/gsc/GSCSearchAnalyticsDashboard";
import { GSCIndexingJobsHistory } from "@/components/gsc/GSCIndexingJobsHistory";
import { PageHeader } from "@/components/layout/PageHeader";
import { PixelTrackingTab } from "@/components/integrations/PixelTrackingTab";

const SiteDetails = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'pages');
  const queryClient = useQueryClient();

  // Handle tab changes with URL sync
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };
  
  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPluginGuide, setShowPluginGuide] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  
  // Sorting States
  const [sortColumn, setSortColumn] = useState<string>("total_page_views");
  const [sortAscending, setSortAscending] = useState(false);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  
  // Selection States
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [fetchingTitles, setFetchingTitles] = useState(false);
  
  // Analytics States
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30");
  const [analyticsEventType, setAnalyticsEventType] = useState("all");
  const [analyticsDevice, setAnalyticsDevice] = useState("all");
  const [analyticsConversionType, setAnalyticsConversionType] = useState("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  // Debounce search term
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch site details
  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ["site-details", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_metrics")
        .select("*")
        .eq("site_id", siteId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });


  // Fetch last conversion city
  const { data: lastConversionCity } = useQuery({
    queryKey: ["last-conversion-city", siteId],
    queryFn: async () => {
      if (!site?.last_conversion_at) return null;
      
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("city")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data?.city;
    },
    enabled: !!siteId && !!site?.last_conversion_at,
  });

  // Fetch pages for this site with pagination, sorting, and filters
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ["site-pages", siteId, currentPage, pageSize, sortColumn, sortAscending, debouncedSearch, statusFilter, clientFilter],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from("rank_rent_page_metrics")
        .select("*", { count: 'exact' })
        .eq("site_id", siteId);
      
      // Apply search filter
      if (debouncedSearch) {
        query = query.or(`page_url.ilike.%${debouncedSearch}%,page_title.ilike.%${debouncedSearch}%,client_name.ilike.%${debouncedSearch}%`);
      }
      
      // Apply status filter
      if (statusFilter === "review") {
        query = query.eq("status", "needs_review");
      } else if (statusFilter === "rented") {
        query = query.eq("is_rented", true);
      } else if (statusFilter === "available") {
        query = query.eq("is_rented", false).eq("status", "active");
      }
      
      // Apply client filter
      if (clientFilter !== "all") {
        if (clientFilter === "none") {
          query = query.is("client_name", null);
        } else {
          query = query.eq("client_name", clientFilter);
        }
      }
      
      // Apply sorting
      query = query.order(sortColumn, { ascending: sortAscending });
      
      // Apply pagination
      query = query.range(from, to);
      
      const { data, error, count } = await query;

      if (error) throw error;
      return { pages: data || [], total: count || 0 };
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });
  
  const pages = pagesData?.pages || [];
  const totalPages = Math.ceil((pagesData?.total || 0) / pageSize);
  
  // Get total count of ALL pages for this site (without filters)
  const { data: totalPagesCount } = useQuery({
    queryKey: ["site-total-pages-count", siteId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("rank_rent_pages")
        .select("*", { count: 'exact', head: true })
        .eq("site_id", siteId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!siteId,
  });
  
  // Fetch user's plan limit
  const { data: userPlanLimit } = useQuery({
    queryKey: ["user-plan-limit"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans (
            name,
            max_pages_per_site
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) return null;
      
      return {
        name: data?.subscription_plans?.name,
        maxPages: data?.subscription_plans?.max_pages_per_site,
        isUnlimited: data?.subscription_plans?.max_pages_per_site === null
      };
    },
  });
  
  // Fetch authenticated user ID for GSC
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
  
  // Get unique clients for filter dropdown
  const { data: allClientsData } = useQuery({
    queryKey: ["all-clients-for-filter", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_page_metrics")
        .select("client_name")
        .eq("site_id", siteId)
        .not("client_name", "is", null);
      
      if (error) throw error;
      
      // Get unique client names
      const uniqueClients = [...new Set(data?.map(p => p.client_name).filter(Boolean))];
      return uniqueClients;
    },
    enabled: !!siteId,
  });
  
  const uniqueClients = allClientsData || [];
  
  // Fetch clients for bulk assignment
  const { data: clients } = useQuery({
    queryKey: ["rank-rent-clients-bulk"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });


  // Calcular datas do período de analytics para page views
  const getPageViewsDates = () => {
    if (analyticsPeriod === "0") {
      return { isAllPeriod: true, startDate: null, endDate: null };
    }
    if (analyticsPeriod === "custom" && customStartDate && customEndDate) {
      return {
        isAllPeriod: false,
        startDate: format(customStartDate, "yyyy-MM-dd"),
        endDate: format(customEndDate, "yyyy-MM-dd")
      };
    }
    const days = parseInt(analyticsPeriod);
    return {
      isAllPeriod: false,
      startDate: format(subDays(new Date(), days), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd")
    };
  };

  // Fetch page views using the same period as analytics
  const { data: pageViewsData, isLoading: pageViewsLoading, refetch: refetchPageViews } = useQuery({
    queryKey: ["page-views-detailed", siteId, analyticsPeriod, customStartDate, customEndDate],
    queryFn: async () => {
      const { isAllPeriod, startDate, endDate } = getPageViewsDates();
      
      console.log('🔍 Fetching page views:', {
        siteId,
        analyticsPeriod,
        isAllPeriod,
        startDate,
        endDate,
        startDateTime: isAllPeriod ? 'N/A' : `${startDate}T00:00:00`,
        endDateTime: isAllPeriod ? 'N/A' : `${endDate}T23:59:59`
      });
      
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      let query = supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .eq("event_type", "page_view");
      
      // Aplicar filtros de data APENAS se não for "todo período"
      if (!isAllPeriod && startDate && endDate) {
        query = query
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`);
      }
      
      query = query
        .order("created_at", { ascending: false })
        .limit(1000);
      
      const { data, error } = await query;
      
      console.log('📊 Page views result:', { 
        data, 
        error, 
        count: data?.length,
        sampleData: data?.[0],
        isAllPeriod,
      });
      
      if (error) {
        console.error('❌ Error fetching page views:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!siteId,
    staleTime: 30000, // Cache de 30 segundos
  });
  
  // Analytics hook
  const analyticsData = useAnalytics({
    siteId: siteId || "",
    period: analyticsPeriod,
    eventType: analyticsEventType,
    device: analyticsDevice,
    conversionType: analyticsConversionType,
    customStartDate,
    customEndDate,
  });

  const handleEditPage = (page: any) => {
    setSelectedPage(page);
    setShowEditDialog(true);
  };
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAscending(!sortAscending);
    } else {
      setSortColumn(column);
      setSortAscending(false);
    }
    setCurrentPage(1); // Reset to first page on sort
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setClientFilter("all");
    setCurrentPage(1);
  };
  
  const handlePageSizeChange = (newSize: string) => {
    const size = Number(newSize);
    if (size === 99999 && (pagesData?.total || 0) > 1000) {
      toast({
        title: "⚠️ Muitas Páginas",
        description: "Para melhor performance, use os filtros ou selecione até 500 por página",
        variant: "destructive",
      });
      return;
    }
    setPageSize(size);
    setCurrentPage(1);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(pages.map(p => p.page_id));
      setSelectedPages(allIds);
      setSelectAll(true);
    } else {
      setSelectedPages(new Set());
      setSelectAll(false);
    }
  };
  
  const handleToggleSelect = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
    setSelectAll(newSelected.size === pages.length);
  };
  
  const handleBulkStatusChange = async (action: string) => {
    if (selectedPages.size === 0) return;
    
    const updates: any = {};
    
    switch (action) {
      case 'available':
        updates.is_rented = false;
        updates.client_id = null;
        updates.status = 'active';
        break;
      case 'rented':
        updates.is_rented = true;
        updates.status = 'active';
        break;
      case 'review':
        updates.status = 'needs_review';
        break;
    }
    
    try {
      const { error } = await supabase
        .from('rank_rent_pages')
        .update(updates)
        .in('id', Array.from(selectedPages));
      
      if (error) throw error;
      
      toast({
        title: "✅ Páginas Atualizadas!",
        description: `${selectedPages.size} página(s) foram atualizadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["site-pages"] });
      setSelectedPages(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as páginas",
        variant: "destructive",
      });
    }
  };
  
  const handleBulkClientChange = async (clientId: string) => {
    if (selectedPages.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('rank_rent_pages')
        .update({
          client_id: clientId === 'none' ? null : clientId,
          is_rented: clientId !== 'none',
        })
        .in('id', Array.from(selectedPages));
      
      if (error) throw error;
      
      toast({
        title: "✅ Cliente Atribuído!",
        description: `${selectedPages.size} página(s) foram atualizadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["site-pages"] });
      setSelectedPages(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Erro ao atribuir cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atribuir o cliente",
        variant: "destructive",
      });
    }
  };
  
  const handleFetchMetaTitles = async () => {
    if (selectedPages.size === 0) {
      toast({
        title: "Nenhuma página selecionada",
        description: "Selecione as páginas que deseja buscar os títulos",
        variant: "destructive",
      });
      return;
    }
    
    setFetchingTitles(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("fetch-page-titles", {
        body: { page_ids: Array.from(selectedPages) },
      });
      
      if (error) throw error;
      
      toast({
        title: "✅ Títulos Atualizados!",
        description: `${data.updated} de ${data.processed} páginas tiveram seus títulos atualizados`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["site-pages"] });
      setSelectedPages(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Erro ao buscar títulos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os títulos",
        variant: "destructive",
      });
    } finally {
      setFetchingTitles(false);
    }
  };
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortAscending ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (siteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Site não encontrado</p>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header showSubtitle={false} />
      
      {/* Breadcrumbs */}
      <div className="bg-card/50 border-b">
        <div className="container mx-auto py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5 transition-colors">
                  <Home className="w-3.5 h-3.5" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard?tab=sites" className="flex items-center gap-1.5 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                  Sites
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{site.site_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      
      {/* Site Header */}
      {/* Modern Page Header */}
      <PageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { label: site.site_name },
        ]}
        title={site.site_name}
        subtitle={
          <div className="flex items-center gap-2">
            <a
              href={site.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              {new URL(site.site_url).hostname}
              <ExternalLink className="w-4 h-4" />
            </a>
            <span>•</span>
            <span>{site.niche}</span>
            <span>•</span>
            <span>{site.location}</span>
          </div>
        }
        badge={{
          label: site.is_rented ? "Alugado" : "Disponível",
          variant: site.is_rented ? "default" : "outline"
        }}
        actions={
          <>
            {site.tracking_pixel_installed && (
              <Badge className="bg-green-600 text-white">
                ✓ Plugin Ativo
              </Badge>
            )}
            {!site.tracking_pixel_installed && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                ⚠ Plugin Inativo
              </Badge>
            )}
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="container mx-auto px-4 lg:px-8 xl:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Páginas Únicas</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-foreground">{site.unique_pages_with_traffic || 0}</p>
                    {userPlanLimit && totalPagesCount !== undefined && (
                      <Badge 
                        variant={
                          totalPagesCount >= (userPlanLimit.maxPages || Infinity) 
                            ? "destructive" 
                            : totalPagesCount >= (userPlanLimit.maxPages || Infinity) * 0.8
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {totalPagesCount} / {userPlanLimit.isUnlimited ? '∞' : userPlanLimit.maxPages}
                        {totalPagesCount >= (userPlanLimit.maxPages || Infinity) && ' 🚫'}
                      </Badge>
                    )}
                  </div>
                </div>
                <Target className="w-8 h-8 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                  <p className="text-2xl font-bold text-foreground">{site.total_page_views?.toLocaleString() || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-2xl font-bold text-foreground">{site.total_conversions || 0}</p>
                </div>
                <MousePointerClick className="w-8 h-8 text-success opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Conv.</p>
                  <p className="text-2xl font-bold text-foreground">{site.conversion_rate || 0}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-warning opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-success opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Última Conv.</p>
                  <p className="text-sm font-medium text-foreground">
                    {site.last_conversion_at
                      ? new Date(site.last_conversion_at).toLocaleDateString("pt-BR")
                      : "Nenhuma"}
                  </p>
                  {lastConversionCity && (
                    <p className="text-xs text-muted-foreground">
                      📍 {lastConversionCity}
                    </p>
                  )}
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <div className="border-b border-gray-200">
            <div className="container mx-auto px-4 lg:px-8 xl:px-12">
              <TabsList className="bg-transparent w-full justify-start gap-1 h-auto p-0">
                <ClickUpTabTrigger value="pages" icon={Globe}>
                  Páginas
                </ClickUpTabTrigger>
                
                <ClickUpTabTrigger value="advanced-analytics" icon={BarChart3}>
                  Analytics Avançado
                </ClickUpTabTrigger>
                
                <ClickUpTabTrigger value="reports" icon={FileText}>
                  Relatórios
                </ClickUpTabTrigger>
                
          <ClickUpTabTrigger value="gsc" icon={Search}>
            Indexador
          </ClickUpTabTrigger>
                
                <ClickUpTabTrigger value="plugin" icon={Plug}>
                  Plugin WordPress
                </ClickUpTabTrigger>
                
                <ClickUpTabTrigger value="pixel-tracking" icon={Globe}>
                  Pixel & E-commerce
                </ClickUpTabTrigger>
              </TabsList>
            </div>
          </div>

          {/* Páginas Tab */}
          <TabsContent value="pages" className="space-y-6">
            {/* Stats Card */}
            <Card className="bg-muted/50 mb-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-lg text-foreground">{totalPagesCount || 0}</strong> páginas cadastradas
                  </div>
                  <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar/Atualizar Sitemap
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Páginas do Site</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pagesData?.total || 0} página(s) total
                      {debouncedSearch || statusFilter !== "all" || clientFilter !== "all" 
                        ? ` (mostrando ${pages.length} filtrada(s))`
                        : ""
                      }
                    </p>
                  </div>
                  <Button onClick={() => setShowImportDialog(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Importar Sitemap
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters Panel */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <Input
                          placeholder="Buscar por URL, título ou cliente..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Select value={statusFilter} onValueChange={(value) => {
                          setStatusFilter(value);
                          setCurrentPage(1);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="rented">Alugadas</SelectItem>
                            <SelectItem value="available">Disponíveis</SelectItem>
                            <SelectItem value="review">Em Revisão</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Select value={clientFilter} onValueChange={(value) => {
                          setClientFilter(value);
                          setCurrentPage(1);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Clientes</SelectItem>
                            <SelectItem value="none">Sem Cliente</SelectItem>
                            {uniqueClients.map((client) => (
                              <SelectItem key={client} value={client}>
                                {client}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {(debouncedSearch || statusFilter !== "all" || clientFilter !== "all") && (
                      <div className="mt-4">
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          Limpar Filtros
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Bulk Actions Bar */}
                {selectedPages.size > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            {selectedPages.size} página(s) selecionada(s)
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPages(new Set());
                              setSelectAll(false);
                            }}
                          >
                            Limpar Seleção
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select onValueChange={handleBulkStatusChange}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Alterar Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Marcar como Disponível</SelectItem>
                              <SelectItem value="rented">Marcar como Alugado</SelectItem>
                              <SelectItem value="review">Marcar para Revisão</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select onValueChange={handleBulkClientChange}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Atribuir Cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Remover Cliente</SelectItem>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleFetchMetaTitles}
                            disabled={fetchingTitles}
                          >
                            {fetchingTitles ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Buscando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Buscar Meta Titles
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Table */}
                {pagesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Carregando páginas...</p>
                  </div>
                ) : pages && pages.length > 0 ? (
                  <>
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectAll}
                                onCheckedChange={handleSelectAll}
                                aria-label="Selecionar todas"
                              />
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("page_title")}
                            >
                              <div className="flex items-center gap-2">
                                Página
                                <SortIcon column="page_title" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("total_page_views")}
                            >
                              <div className="flex items-center justify-end gap-2">
                                Views
                                <SortIcon column="total_page_views" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("total_conversions")}
                            >
                              <div className="flex items-center justify-end gap-2">
                                Conversões
                                <SortIcon column="total_conversions" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("conversion_rate")}
                            >
                              <div className="flex items-center justify-end gap-2">
                                Taxa Conv.
                                <SortIcon column="conversion_rate" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("last_conversion_at")}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <Calendar className="w-4 h-4" />
                                Última Conversão
                                <SortIcon column="last_conversion_at" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("monthly_rent_value")}
                            >
                              <div className="flex items-center justify-end gap-2">
                                Valor Mensal
                                <SortIcon column="monthly_rent_value" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-center cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("is_rented")}
                            >
                              <div className="flex items-center justify-center gap-2">
                                Status
                                <SortIcon column="is_rented" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 select-none"
                              onClick={() => handleSort("client_name")}
                            >
                              <div className="flex items-center gap-2">
                                Cliente
                                <SortIcon column="client_name" />
                              </div>
                            </TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pages.map((page) => (
                            <TableRow key={page.page_id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedPages.has(page.page_id)}
                                  onCheckedChange={() => handleToggleSelect(page.page_id)}
                                  aria-label={`Selecionar ${page.page_title || page.page_url}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <div className="font-medium text-foreground truncate">
                                    {page.page_title || "Sem título"}
                                  </div>
                                  <a
                                    href={page.page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    {page.page_path}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-foreground">
                                {page.total_page_views?.toLocaleString() || 0}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-foreground">
                                {page.total_conversions || 0}
                              </TableCell>
                              <TableCell className="text-right text-foreground">
                                {page.conversion_rate || 0}%
                              </TableCell>
                              <TableCell className="text-right">
                                {page.last_conversion_at ? (
                                  <div className="flex items-center justify-end gap-1 text-foreground text-sm">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span>
                                      {new Date(page.last_conversion_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-success">
                                R${" "}
                                {Number(page.monthly_rent_value || 0).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-center">
                                {page.status === 'needs_review' ? (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                    Em Revisão
                                  </Badge>
                                ) : page.is_rented ? (
                                  <Badge className="bg-success text-success-foreground">Alugada</Badge>
                                ) : (
                                  <Badge variant="outline">Disponível</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {page.client_name ? (
                                  <span className="text-sm text-foreground">{page.client_name}</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditPage(page)}
                                  className="gap-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, pagesData?.total || 0)} de {pagesData?.total || 0} páginas
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 por página</SelectItem>
                            <SelectItem value="50">50 por página</SelectItem>
                            <SelectItem value="100">100 por página</SelectItem>
                            <SelectItem value="200">200 por página</SelectItem>
                            <SelectItem value="500">500 por página</SelectItem>
                            <SelectItem value="99999">Mostrar Tudo</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                          >
                            Primeira
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                          >
                            Anterior
                          </Button>
                          <span className="px-3 py-1 text-sm">
                            Página {currentPage} de {totalPages}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                          >
                            Próxima
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            Última
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {debouncedSearch || statusFilter !== "all" || clientFilter !== "all"
                        ? "Nenhuma página encontrada com esses filtros."
                        : "Nenhuma página cadastrada ainda."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="advanced-analytics" className="space-y-6">
            <AnalyticsFilters
              period={analyticsPeriod}
              onPeriodChange={setAnalyticsPeriod}
              eventType={analyticsEventType}
              onEventTypeChange={setAnalyticsEventType}
              device={analyticsDevice}
              onDeviceChange={setAnalyticsDevice}
              conversionType={analyticsConversionType}
              onConversionTypeChange={setAnalyticsConversionType}
              customStartDate={customStartDate}
              onCustomStartDateChange={setCustomStartDate}
              customEndDate={customEndDate}
              onCustomEndDateChange={setCustomEndDate}
            />
            
            <MetricsCards 
              metrics={analyticsData.metrics} 
              isLoading={analyticsData.isLoading} 
              sparklineData={analyticsData.sparklineData}
              previousMetrics={analyticsData.previousMetrics}
            />
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-transparent w-full justify-start gap-1 h-auto p-0 border-b border-gray-200">
                <ClickUpTabTrigger value="overview">Visão Geral</ClickUpTabTrigger>
                <ClickUpTabTrigger value="conversions">Conversões</ClickUpTabTrigger>
                <ClickUpTabTrigger value="pageviews">Page Views</ClickUpTabTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TimelineChart 
                    data={analyticsData.timeline} 
                    isLoading={analyticsData.isLoading} 
                  />
                  <EventsPieChart 
                    data={analyticsData.events} 
                    isLoading={analyticsData.isLoading} 
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ConversionRateChart 
                    data={analyticsData.conversionRateData || []} 
                    isLoading={analyticsData.isLoading} 
                  />
                  <ConversionFunnelChart 
                    data={analyticsData.funnelData || { pageViews: 0, interactions: 0, conversions: 0 }} 
                    isLoading={analyticsData.isLoading} 
                  />
                </div>
                
                <TopPagesChart 
                  data={analyticsData.topPages} 
                  isLoading={analyticsData.isLoading} 
                />
                
                <HourlyHeatmap 
                  data={analyticsData.hourlyData || []} 
                  isLoading={analyticsData.isLoading} 
                />
              </TabsContent>
              
              <TabsContent value="conversions" className="space-y-6 mt-6">
                <ConversionsTimelineChart 
                  data={analyticsData.conversionsTimeline || []} 
                  isLoading={analyticsData.isLoading}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TopConversionPagesChart 
                    data={analyticsData.topConversionPages || []} 
                    isLoading={analyticsData.isLoading}
                  />
                  <ConversionTypeDistributionChart 
                    data={analyticsData.conversionTypeDistribution || []} 
                    isLoading={analyticsData.isLoading}
                  />
                </div>
                
                <ConversionHeatmapChart 
                  data={analyticsData.conversionHourlyData || {}} 
                  isLoading={analyticsData.isLoading}
                />
                
                <ConversionsTable 
                  conversions={analyticsData.conversions || []} 
                  isLoading={analyticsData.isLoading}
                  siteId={siteId || ""}
                />
              </TabsContent>
              
              <TabsContent value="pageviews" className="space-y-6 mt-6">
                <PageViewsTimelineChart 
                  data={analyticsData.pageViewsTimeline || []} 
                  isLoading={analyticsData.isLoading} 
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TopPageViewsChart 
                    data={analyticsData.topPageViewPages || []} 
                    isLoading={analyticsData.isLoading}
                  />
                  <PageViewsDistributionChart 
                    data={analyticsData.pageViewsDeviceDistribution || []} 
                    isLoading={analyticsData.isLoading}
                  />
                </div>
                
                <PageViewsHeatmapChart 
                  data={analyticsData.pageViewHourlyData || {}} 
                  isLoading={analyticsData.isLoading}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      console.log('🔄 Botão Atualizar clicado');
                      
                      // Invalidar com queryKey completo
                      queryClient.invalidateQueries({ 
                        queryKey: ["page-views-detailed", siteId, analyticsPeriod, customStartDate, customEndDate] 
                      });
                      
                      // Forçar refetch
                      refetchPageViews();
                      
                      toast({
                        title: "Dados atualizados",
                        description: "Os dados de visualizações foram atualizados com sucesso."
                      });
                    }}
                    variant="outline" 
                    size="sm"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                  </div>
                  
                  <PageViewsTable 
                    pageViews={pageViewsData || []} 
                    isLoading={pageViewsLoading}
                    siteId={siteId || ""}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Relatórios Tab */}
          <TabsContent value="reports">
            <ReportsTab siteId={siteId || ""} siteName={site.site_name} />
          </TabsContent>

          {/* Google Search Console Tab */}
          <TabsContent value="gsc" className="space-y-6">
            {userData?.id && siteId ? (
              <>
                {/* Integrations Management */}
                <GSCIntegrationsManager 
                  siteId={siteId} 
                  userId={userData.id}
                  site={{
                    url: site.site_url,
                    name: site.site_name
                  }}
                />

                {/* Integration Health Card - Only show if there are integrations */}
                {/* This would require querying integrations first - for now, we'll add it in the next iteration */}

                {/* Indexing Controls */}
                <GSCIndexingControls 
                  siteId={siteId}
                  integrationId={undefined} // Will be set when user selects an integration
                />

                {/* Alerts Panel */}
                <GSCIndexingAlertsPanel siteId={siteId} />

                {/* Secondary Tabs for detailed views */}
                <Card>
                  <CardContent className="p-6">
                    <Tabs defaultValue="urls" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <ClickUpTabTrigger value="urls">
                          <Globe className="h-4 w-4 mr-2" />
                          URLs Descobertas
                        </ClickUpTabTrigger>
                        <ClickUpTabTrigger value="analytics">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </ClickUpTabTrigger>
                        <ClickUpTabTrigger value="jobs">
                          <Clock className="h-4 w-4 mr-2" />
                          Histórico de Jobs
                        </ClickUpTabTrigger>
                      </TabsList>

                      <TabsContent value="urls">
                        <GSCDiscoveredUrlsTable 
                          siteId={siteId}
                          integrationId={undefined} // Will be set when user selects an integration
                        />
                      </TabsContent>

                      <TabsContent value="analytics">
                        <GSCSearchAnalyticsDashboard siteId={siteId} />
                      </TabsContent>

                      <TabsContent value="jobs">
                        <GSCIndexingJobsHistory siteId={siteId} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Carregando informações de autenticação...
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Plugin WordPress Tab */}
          <TabsContent value="plugin">
            <PluginDownloadCard 
              onOpenGuide={() => setShowPluginGuide(true)}
              siteId={siteId}
              trackingToken={site.tracking_token}
              trackingPixelInstalled={site.tracking_pixel_installed}
              siteName={site.site_name}
            />
          </TabsContent>

          {/* Pixel & E-commerce Tab */}
          <TabsContent value="pixel-tracking">
            <PixelTrackingTab 
              siteId={siteId || ""}
              trackingToken={site.tracking_token}
              siteName={site.site_name}
              pixelInstalled={site.tracking_pixel_installed}
            />
          </TabsContent>

        </Tabs>
      </div>

      {/* Dialogs */}
      {selectedPage && (
        <EditPageDialog page={selectedPage} open={showEditDialog} onOpenChange={setShowEditDialog} />
      )}
      <ImportSitemapDialog siteId={siteId || ""} open={showImportDialog} onOpenChange={setShowImportDialog} />
      <PluginInstallationGuide open={showPluginGuide} onOpenChange={setShowPluginGuide} />
      <DeleteSiteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        siteId={siteId || ""}
        siteName={site?.site_name || ""}
        totalPages={totalPagesCount || 0}
        isRented={site?.is_rented || false}
      />
      
      <Footer />
    </div>
  );
};

export default SiteDetails;
