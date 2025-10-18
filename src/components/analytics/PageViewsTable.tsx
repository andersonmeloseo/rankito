import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Smartphone, Monitor, Tablet, Chrome, Globe, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PeriodSelector } from "./PeriodSelector";

interface PageViewsTableProps {
  pageViews: any[];
  isLoading: boolean;
  siteId: string;
  onPeriodChange?: (startDate: string, endDate: string) => void;
}

export const PageViewsTable = ({ pageViews, isLoading, siteId, onPeriodChange }: PageViewsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [browserFilter, setBrowserFilter] = useState("all");
  const [referrerFilter, setReferrerFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: "created_at" | "page_path" | "device" | "browser" | "city" | "referrer";
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const itemsPerPage = 20;

  // Utility functions - must be defined before useMemo hooks
  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return { name: "Desconhecido", icon: Globe, color: "text-muted-foreground" };
    
    const ua = userAgent.toLowerCase();
    if (ua.includes("chrome") && !ua.includes("edg")) {
      return { name: "Chrome", icon: Chrome, color: "text-yellow-600" };
    }
    if (ua.includes("safari") && !ua.includes("chrome")) {
      return { name: "Safari", icon: Globe, color: "text-blue-600" };
    }
    if (ua.includes("firefox")) {
      return { name: "Firefox", icon: Globe, color: "text-orange-600" };
    }
    if (ua.includes("edg")) {
      return { name: "Edge", icon: Globe, color: "text-blue-800" };
    }
    return { name: "Outro", icon: Globe, color: "text-muted-foreground" };
  };

  const getDeviceInfo = (device: string) => {
    const deviceLower = device?.toLowerCase() || "desktop";
    if (deviceLower.includes("mobile") || deviceLower.includes("android") || deviceLower.includes("iphone")) {
      return { icon: Smartphone, color: "text-blue-500", label: "Mobile" };
    }
    if (deviceLower.includes("tablet") || deviceLower.includes("ipad")) {
      return { icon: Tablet, color: "text-purple-500", label: "Tablet" };
    }
    return { icon: Monitor, color: "text-green-500", label: "Desktop" };
  };

  // Get unique browsers from pageViews
  const uniqueBrowsers = useMemo(() => {
    const browsers = new Set(
      pageViews?.map(pv => getBrowserInfo(pv.user_agent).name) || []
    );
    return Array.from(browsers).sort();
  }, [pageViews]);

  // Get unique referrers (top 10 by frequency)
  const uniqueReferrers = useMemo(() => {
    const referrers = pageViews
      ?.filter(pv => pv.referrer)
      .map(pv => {
        try {
          return new URL(pv.referrer).hostname;
        } catch {
          return pv.referrer;
        }
      }) || [];
    
    const counts = referrers.reduce((acc, ref) => {
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(([ref]) => ref);
  }, [pageViews]);

  const filteredPageViews = useMemo(() => {
    let filtered = pageViews?.filter(pv => {
      const matchesSearch = searchTerm === "" || 
        pv.page_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pv.referrer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDevice = deviceFilter === "all" || 
        (pv.metadata?.device || "desktop") === deviceFilter;

      const matchesBrowser = browserFilter === "all" || 
        getBrowserInfo(pv.user_agent).name === browserFilter;

      const matchesReferrer = referrerFilter === "all" || 
        (referrerFilter === "direct" && !pv.referrer) ||
        (pv.referrer && (() => {
          try {
            return new URL(pv.referrer).hostname === referrerFilter;
          } catch {
            return pv.referrer === referrerFilter;
          }
        })());
      
      return matchesSearch && matchesDevice && matchesBrowser && matchesReferrer;
    }) || [];

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "page_path":
          aValue = a.page_path || "";
          bValue = b.page_path || "";
          break;
        case "device":
          aValue = a.metadata?.device || "desktop";
          bValue = b.metadata?.device || "desktop";
          break;
        case "browser":
          aValue = a.user_agent || "";
          bValue = b.user_agent || "";
          break;
        case "city":
          aValue = a.city || "Desconhecido";
          bValue = b.city || "Desconhecido";
          break;
        case "referrer":
          aValue = a.referrer || "";
          bValue = b.referrer || "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [pageViews, searchTerm, deviceFilter, browserFilter, referrerFilter, sortConfig]);

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDeviceFilter("all");
    setBrowserFilter("all");
    setReferrerFilter("all");
    setSortConfig({ key: "created_at", direction: "desc" });
  };

  const hasActiveFilters = searchTerm || deviceFilter !== "all" || browserFilter !== "all" || referrerFilter !== "all";

  const totalPages = Math.ceil(filteredPageViews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageViews = filteredPageViews.slice(startIndex, endIndex);


  const exportToCSV = () => {
    if (!filteredPageViews || filteredPageViews.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há visualizações no período selecionado",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Data", "Hora", "Página", "Dispositivo", "Browser", "Cidade", "Estado", "País", "Referrer"];
    const rows = filteredPageViews.map(pv => [
      new Date(pv.created_at).toLocaleDateString("pt-BR"),
      new Date(pv.created_at).toLocaleTimeString("pt-BR"),
      pv.page_path,
      pv.metadata?.device || "-",
      getBrowserInfo(pv.user_agent).name,
      pv.city || "-",
      pv.region || "-",
      pv.country || "-",
      pv.referrer || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `page-views-${siteId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "✅ Exportado com sucesso!",
      description: `${filteredPageViews.length} visualizações foram exportadas para CSV`,
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Visualizações de Página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pageViews || pageViews.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Visualizações de Página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Nenhuma visualização registrada no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visualizações de Página</CardTitle>
            <CardDescription>
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredPageViews.length)} de {filteredPageViews.length} visualizações
              {hasActiveFilters ? ` (filtrado de ${pageViews.length} total)` : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onPeriodChange && (
              <PeriodSelector onPeriodChange={onPeriodChange} defaultPeriod={30} />
            )}
            <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por URL ou referrer..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            
            <Select value={deviceFilter} onValueChange={(value) => {
              setDeviceFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos dispositivos</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={browserFilter} onValueChange={(value) => {
              setBrowserFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Browser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos browsers</SelectItem>
                {uniqueBrowsers.map(browser => (
                  <SelectItem key={browser} value={browser}>{browser}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={referrerFilter} onValueChange={(value) => {
              setReferrerFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fontes</SelectItem>
                <SelectItem value="direct">Direto</SelectItem>
                {uniqueReferrers.map(ref => (
                  <SelectItem key={ref} value={ref}>{ref}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground">
              {filteredPageViews.length} visualizações encontradas
            </div>
          )}
        </div>

        <div className="rounded-md border">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-2">
                      Data/Hora
                      {sortConfig.key === "created_at" && (
                        sortConfig.direction === "asc" ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                      {sortConfig.key !== "created_at" && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("page_path")}
                  >
                    <div className="flex items-center gap-2">
                      Página
                      {sortConfig.key === "page_path" && (
                        sortConfig.direction === "asc" ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                      {sortConfig.key !== "page_path" && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("device")}
                  >
                    <div className="flex items-center gap-2">
                      Dispositivo
                      {sortConfig.key === "device" && (
                        sortConfig.direction === "asc" ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                      {sortConfig.key !== "device" && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("browser")}
                  >
                    <div className="flex items-center gap-2">
                      Browser
                      {sortConfig.key === "browser" && (
                        sortConfig.direction === "asc" ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                      {sortConfig.key !== "browser" && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("city")}
                  >
                    <div className="flex items-center gap-2">
                      Localização
                      {sortConfig.key === "city" && (
                        sortConfig.direction === "asc" ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                      {sortConfig.key !== "city" && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("referrer")}
                  >
                    <div className="flex items-center gap-2">
                      Referrer
                      {sortConfig.key === "referrer" && (
                        sortConfig.direction === "asc" ? 
                          <ArrowUp className="w-4 h-4" /> : 
                          <ArrowDown className="w-4 h-4" />
                      )}
                      {sortConfig.key !== "referrer" && <ArrowUpDown className="w-4 h-4 opacity-30" />}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageViews.map((pv) => {
                  const deviceInfo = getDeviceInfo(pv.metadata?.device);
                  const DeviceIcon = deviceInfo.icon;

                  return (
                    <TableRow key={pv.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {new Date(pv.created_at).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(pv.created_at).toLocaleTimeString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="max-w-xs truncate cursor-help">
                              {pv.page_path}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-sm">{pv.page_path}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className={`w-4 h-4 ${deviceInfo.color}`} />
                          <span className="text-sm">{deviceInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const browserInfo = getBrowserInfo(pv.user_agent);
                          const BrowserIcon = browserInfo.icon;
                          return (
                            <div className="flex items-center gap-2">
                              <BrowserIcon className={`w-4 h-4 ${browserInfo.color}`} />
                              <span className="text-sm">{browserInfo.name}</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {pv.city && pv.region 
                            ? `${pv.city}, ${pv.region}`
                            : pv.city || pv.region || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground" title={pv.referrer || "-"}>
                          {pv.referrer || "Direto"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};