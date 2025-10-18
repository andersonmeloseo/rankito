import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, TrendingUp, Eye, MousePointerClick, DollarSign, Target, Calendar, Edit, Copy, Upload, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, RefreshCw, BarChart3 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { EditPageDialog } from "@/components/rank-rent/EditPageDialog";
import { ImportSitemapDialog } from "@/components/rank-rent/ImportSitemapDialog";
import { PluginDownloadCard } from "@/components/rank-rent/PluginDownloadCard";
import { PluginInstallationGuide } from "@/components/rank-rent/PluginInstallationGuide";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { MetricsCards } from "@/components/analytics/MetricsCards";
import { TimelineChart } from "@/components/analytics/TimelineChart";
import { TopPagesChart } from "@/components/analytics/TopPagesChart";
import { EventsPieChart } from "@/components/analytics/EventsPieChart";
import { ConversionsTable } from "@/components/analytics/ConversionsTable";
import { ConversionRateChart } from "@/components/analytics/ConversionRateChart";
import { ConversionFunnelChart } from "@/components/analytics/ConversionFunnelChart";
import { HourlyHeatmap } from "@/components/analytics/HourlyHeatmap";
import { PageViewsTimelineChart } from "@/components/analytics/PageViewsTimelineChart";
import { TopReferrersChart } from "@/components/analytics/TopReferrersChart";
import { PagePerformanceChart } from "@/components/analytics/PagePerformanceChart";
import { PageViewsTable } from "@/components/analytics/PageViewsTable";
import { useAnalytics } from "@/hooks/useAnalytics";
import { format, subDays } from "date-fns";

const SiteDetails = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
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
  const [analyticsPeriod, setAnalyticsPeriod] = useState("7");
  const [analyticsEventType, setAnalyticsEventType] = useState("all");
  const [analyticsDevice, setAnalyticsDevice] = useState("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  // Page Views Period State (separate from main analytics)
  const [pageViewsPeriod, setPageViewsPeriod] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  
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
      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent conversions
  const { data: conversions, isLoading: conversionsLoading } = useQuery({
    queryKey: ["site-conversions", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .neq("event_type", "page_view")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId,
    refetchInterval: 30000,
  });

  // Fetch page views with separate period control
  const { data: pageViewsData, isLoading: pageViewsLoading } = useQuery({
    queryKey: ["page-views-detailed", siteId, pageViewsPeriod.startDate, pageViewsPeriod.endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .eq("event_type", "page_view")
        .gte("created_at", pageViewsPeriod.startDate)
        .lte("created_at", pageViewsPeriod.endDate)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!siteId,
  });
  
  // Analytics hook
  const analyticsData = useAnalytics({
    siteId: siteId || "",
    period: analyticsPeriod,
    eventType: analyticsEventType,
    device: analyticsDevice,
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{site.site_name}</h1>
                  {site.is_rented ? (
                    <Badge className="bg-success text-success-foreground">Alugado</Badge>
                  ) : (
                    <Badge variant="outline">Disponível</Badge>
                  )}
                  {site.tracking_pixel_installed ? (
                    <Badge className="bg-green-600 text-white">
                      ✓ Plugin Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                      ⚠ Plugin Inativo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={site.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {new URL(site.site_url).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{site.niche}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{site.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Páginas Únicas</p>
                  <p className="text-2xl font-bold text-foreground">{site.unique_pages_with_traffic || 0}</p>
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
                <div>
                  <p className="text-sm text-muted-foreground">Última Conv.</p>
                  <p className="text-sm font-medium text-foreground">
                    {site.last_conversion_at
                      ? new Date(site.last_conversion_at).toLocaleDateString("pt-BR")
                      : "Nenhuma"}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="pages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-5xl">
            <TabsTrigger value="pages">Páginas</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
            <TabsTrigger value="advanced-analytics">Analytics Avançado</TabsTrigger>
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="plugin">Plugin WordPress</TabsTrigger>
            <TabsTrigger value="conversions">Conversões</TabsTrigger>
          </TabsList>

          {/* Páginas Tab */}
          <TabsContent value="pages">
            {/* Stats Card */}
            <Card className="bg-muted/50 mb-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <strong className="text-lg text-foreground">{pagesData?.total || 0}</strong> páginas cadastradas
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

          {/* Análise Tab */}
          <TabsContent value="analytics">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Análise e Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Performance Geral</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Total de Visualizações</span>
                        <span className="font-semibold text-foreground">{site.total_page_views?.toLocaleString() || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Total de Conversões</span>
                        <span className="font-semibold text-success">{site.total_conversions || 0}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Taxa de Conversão</span>
                        <span className="font-semibold text-foreground">{site.conversion_rate || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Informações Financeiras</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Valor Mensal Atual</span>
                        <span className="font-semibold text-success">
                          R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Páginas Alugadas</span>
                        <span className="font-semibold text-foreground">
                          {pages?.filter((p) => p.is_rented).length || 0} / {pages?.length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-foreground">Valor Médio por Página</span>
                        <span className="font-semibold text-foreground">
                          R${" "}
                          {pages && pages.length > 0
                            ? (Number(site.monthly_rent_value || 0) / pages.length).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })
                            : "0,00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="conversions">Conversões</TabsTrigger>
                <TabsTrigger value="pageviews">Page Views</TabsTrigger>
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
                <ConversionsTable 
                  conversions={analyticsData.conversions || []} 
                  isLoading={analyticsData.isLoading}
                  siteId={siteId || ""}
                />
              </TabsContent>
              
              <TabsContent value="pageviews" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PageViewsTimelineChart 
                    data={analyticsData.pageViewsTimeline || []} 
                    isLoading={analyticsData.isLoading} 
                  />
                  <TopReferrersChart 
                    data={analyticsData.topReferrers || []} 
                    isLoading={analyticsData.isLoading} 
                  />
                </div>
                
                <PagePerformanceChart 
                  data={analyticsData.pagePerformance || []} 
                  isLoading={analyticsData.isLoading} 
                />
                
                <PageViewsTable 
                  pageViews={pageViewsData || []} 
                  isLoading={pageViewsLoading}
                  siteId={siteId || ""}
                  onPeriodChange={(startDate, endDate) => {
                    setPageViewsPeriod({ startDate, endDate });
                  }}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Cliente Tab */}
          <TabsContent value="client">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {site.client_name ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome do Cliente</label>
                      <p className="text-foreground mt-1">{site.client_name}</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status do Contrato</label>
                        <div className="mt-1">
                          {site.is_rented ? (
                            <Badge className="bg-success text-success-foreground">Ativo</Badge>
                          ) : (
                            <Badge variant="outline">Inativo</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                        <p className="text-foreground mt-1 font-semibold">
                          R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum cliente vinculado a este site.</p>
                  </div>
                )}
              </CardContent>
            </Card>
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

          {/* Conversões Tab */}
          <TabsContent value="conversions">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Conversões Recentes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Últimas 50 conversões registradas</p>
              </CardHeader>
              <CardContent>
                {conversionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </div>
                ) : conversions && conversions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Página</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>CTA</TableHead>
                          <TableHead>IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conversions.map((conversion) => (
                          <TableRow key={conversion.id}>
                            <TableCell className="text-foreground">
                              {new Date(conversion.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <a
                                href={conversion.page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {conversion.page_path}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{conversion.event_type}</Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{conversion.cta_text || "-"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{conversion.ip_address || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma conversão registrada ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {selectedPage && (
        <EditPageDialog page={selectedPage} open={showEditDialog} onOpenChange={setShowEditDialog} />
      )}
      <ImportSitemapDialog siteId={siteId || ""} open={showImportDialog} onOpenChange={setShowImportDialog} />
      <PluginInstallationGuide open={showPluginGuide} onOpenChange={setShowPluginGuide} />
    </div>
  );
};

export default SiteDetails;
