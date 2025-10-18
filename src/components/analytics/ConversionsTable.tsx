import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown, X, Smartphone, Monitor, Tablet, Chrome, Globe, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PeriodSelector } from "./PeriodSelector";
import { useQueryClient } from "@tanstack/react-query";

interface ConversionsTableProps {
  conversions: any[];
  isLoading: boolean;
  siteId: string;
  onPeriodChange?: (startDate: string, endDate: string) => void;
  lastUpdatedAt?: number;
}

export const ConversionsTable = ({ conversions, isLoading, siteId, onPeriodChange, lastUpdatedAt }: ConversionsTableProps) => {
  const queryClient = useQueryClient();
  console.log('🔍 ConversionsTable recebeu:', {
    conversionsCount: conversions?.length,
    isLoading,
    hasOnPeriodChange: !!onPeriodChange,
    firstConversion: conversions?.[0],
    isArray: Array.isArray(conversions),
    isUndefined: conversions === undefined,
    isNull: conversions === null
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [conversionStartDate, setConversionStartDate] = useState<Date | undefined>();
  const [conversionEndDate, setConversionEndDate] = useState<Date | undefined>();
  const [sortConfig, setSortConfig] = useState<{
    key: "created_at" | "event_type" | "page_path" | "device" | "browser" | "city";
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const itemsPerPage = 20;

  const handlePeriodChange = (startDate: string, endDate: string) => {
    console.log('📅 Período alterado:', { startDate, endDate });
    setConversionStartDate(new Date(startDate));
    setConversionEndDate(new Date(endDate));
    setCurrentPage(1);
    if (onPeriodChange) {
      onPeriodChange(startDate, endDate);
    }
  };

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setEventTypeFilter("all");
    setDeviceFilter("all");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics-conversions", siteId] });
    toast({ title: "Dados atualizados!" });
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdatedAt) return "agora mesmo";
    const seconds = Math.floor((Date.now() - lastUpdatedAt) / 1000);
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
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

  const filteredConversions = useMemo(() => {
    console.log('🔄 useMemo executando com conversions:', conversions?.length);
    
    // Garantir que sempre retorne um array
    if (!conversions || !Array.isArray(conversions)) {
      console.log('⚠️ conversions inválido, retornando []');
      return [];
    }
    
    let filtered = conversions.filter(conv => {
      const matchesSearch = searchTerm === "" || 
        conv.page_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEventType = eventTypeFilter === "all" || conv.event_type === eventTypeFilter;
      
      const convDevice = conv.metadata?.device?.toLowerCase() || "desktop";
      const matchesDevice = deviceFilter === "all" || 
        (deviceFilter === "mobile" && (convDevice.includes("mobile") || convDevice.includes("android") || convDevice.includes("iphone"))) ||
        (deviceFilter === "tablet" && (convDevice.includes("tablet") || convDevice.includes("ipad"))) ||
        (deviceFilter === "desktop" && !convDevice.includes("mobile") && !convDevice.includes("tablet") && !convDevice.includes("android") && !convDevice.includes("iphone") && !convDevice.includes("ipad"));
      
      // Filtro de data (se definido)
      const matchesDateRange = (() => {
        // Se não houver filtro de data definido, mostrar todos
        if (!conversionStartDate && !conversionEndDate) {
          return true;
        }
        
        // Se houver filtro de data, aplicar comparação ajustada
        if (conversionStartDate && conversionEndDate) {
          const convDate = new Date(conv.created_at);
          
          // Ajustar startDate para início do dia (00:00:00)
          const startOfDay = new Date(conversionStartDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          // Ajustar endDate para fim do dia (23:59:59)
          const endOfDay = new Date(conversionEndDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          return convDate >= startOfDay && convDate <= endOfDay;
        }
        
        // Se apenas uma data foi definida (não deveria acontecer), mostrar todos
        return true;
      })();
      
      return matchesSearch && matchesEventType && matchesDevice && matchesDateRange;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "event_type":
          aValue = a.event_type || "";
          bValue = b.event_type || "";
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
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    console.log('✅ useMemo retornando filtered:', filtered.length);
    return filtered;
  }, [conversions, searchTerm, eventTypeFilter, deviceFilter, sortConfig, conversionStartDate, conversionEndDate]);

  const totalPages = Math.ceil((filteredConversions?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConversions = (filteredConversions || []).slice(startIndex, endIndex);

  const exportToCSV = () => {
    if (!filteredConversions || filteredConversions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há conversões no período selecionado",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Data", "Hora", "Tipo", "Página", "Dispositivo", "Browser", "Cidade", "Estado", "País"];
    const rows = filteredConversions.map(conv => [
      new Date(conv.created_at).toLocaleDateString("pt-BR"),
      new Date(conv.created_at).toLocaleTimeString("pt-BR"),
      conv.event_type,
      conv.page_path,
      conv.metadata?.device || "-",
      getBrowserInfo(conv.user_agent).name,
      conv.city || "-",
      conv.region || "-",
      conv.country || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conversoes-${siteId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "✅ Exportado com sucesso!",
      description: `${filteredConversions?.length || 0} conversões foram exportadas para CSV`,
    });
  };

  const hasActiveFilters = searchTerm !== "" || eventTypeFilter !== "all" || deviceFilter !== "all";

  const getEventBadgeVariant = (eventType: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (eventType) {
      case "whatsapp_click":
        return "default";
      case "phone_click":
        return "secondary";
      case "email_click":
        return "outline";
      case "form_submit":
        return "destructive";
      default:
        return "outline";
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: typeof sortConfig.key }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Conversões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // REMOVIDO: Early return estava bloqueando renderização mesmo com dados
  console.log('🚨 Verificando condições antes do early return:', {
    conversionsExists: !!conversions,
    conversionsLength: conversions?.length,
    shouldShowEmptyState: !conversions || conversions.length === 0
  });

  console.log('📊 Dados filtrados antes do render:', {
    filteredCount: filteredConversions?.length,
    currentPageCount: currentConversions?.length,
    currentPage,
    totalPages
  });

  console.log('✅ Iniciando renderização da tabela de conversões');

  try {
    return (
    <TooltipProvider>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversões Detalhadas</CardTitle>
              <CardDescription>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredConversions?.length || 0)} de {filteredConversions?.length || 0} conversões
                {hasActiveFilters ? ` (filtrado de ${conversions?.length || 0} total)` : ""}
                <span className="ml-2 text-xs text-muted-foreground">
                  • Atualizado {getTimeSinceUpdate()}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <PeriodSelector 
                onPeriodChange={handlePeriodChange} 
                defaultPeriod={30} 
              />
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por página ou cidade..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={eventTypeFilter} onValueChange={(value) => {
              setEventTypeFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="whatsapp_click">WhatsApp</SelectItem>
                <SelectItem value="phone_click">Telefone</SelectItem>
                <SelectItem value="email_click">Email</SelectItem>
                <SelectItem value="form_submit">Formulário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deviceFilter} onValueChange={(value) => {
              setDeviceFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dispositivos</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button onClick={clearFilters} size="sm" variant="ghost" className="gap-2">
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Data/Hora
                      <SortIcon columnKey="created_at" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("event_type")}
                  >
                    <div className="flex items-center">
                      Tipo
                      <SortIcon columnKey="event_type" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("page_path")}
                  >
                    <div className="flex items-center">
                      Página
                      <SortIcon columnKey="page_path" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort("device")}
                  >
                    <div className="flex items-center">
                      Dispositivo
                      <SortIcon columnKey="device" />
                    </div>
                  </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("browser")}
                >
                  <div className="flex items-center">
                    Browser
                    <SortIcon columnKey="browser" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center">
                    Localização
                    <SortIcon columnKey="city" />
                  </div>
                </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentConversions.map((conv) => {
                  const deviceInfo = getDeviceInfo(conv.metadata?.device);
                  const DeviceIcon = deviceInfo.icon;
                  
                  return (
                    <TableRow key={conv.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {new Date(conv.created_at).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleTimeString("pt-BR", {
                              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEventBadgeVariant(conv.event_type)}>
                          {conv.event_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="max-w-xs truncate cursor-help">
                              {conv.page_path}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-sm">{conv.page_path}</p>
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
                          const browserInfo = getBrowserInfo(conv.user_agent);
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
                          {conv.city && conv.region 
                            ? `${conv.city}, ${conv.region}`
                            : conv.city || conv.region || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
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
    </TooltipProvider>
  );
  } catch (error) {
    console.error('❌ Erro ao renderizar ConversionsTable:', error);
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Conversões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-destructive">
            Erro ao renderizar tabela: {error instanceof Error ? error.message : 'Erro desconhecido'}
          </div>
        </CardContent>
      </Card>
    );
  }
};
