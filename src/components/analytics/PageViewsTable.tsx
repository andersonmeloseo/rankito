import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Smartphone, Monitor, Tablet, Chrome, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PageViewsTableProps {
  pageViews: any[];
  isLoading: boolean;
  siteId: string;
}

export const PageViewsTable = ({ pageViews, isLoading, siteId }: PageViewsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const itemsPerPage = 20;

  const filteredPageViews = pageViews?.filter(pv => {
    const matchesSearch = searchTerm === "" || 
      pv.page_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pv.referrer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDevice = deviceFilter === "all" || 
      (pv.metadata?.device || "desktop") === deviceFilter;
    
    return matchesSearch && matchesDevice;
  }) || [];

  const totalPages = Math.ceil(filteredPageViews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageViews = filteredPageViews.slice(startIndex, endIndex);

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return { name: "Desconhecido", icon: Globe };
    
    if (userAgent.includes("Chrome")) return { name: "Chrome", icon: Chrome };
    if (userAgent.includes("Firefox")) return { name: "Firefox", icon: Globe };
    if (userAgent.includes("Safari")) return { name: "Safari", icon: Globe };
    return { name: "Outro", icon: Globe };
  };

  const getDeviceInfo = (device: string) => {
    switch(device) {
      case "mobile": return { icon: Smartphone, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" };
      case "tablet": return { icon: Tablet, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" };
      default: return { icon: Monitor, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" };
    }
  };

  const exportToCSV = () => {
    if (!filteredPageViews || filteredPageViews.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há visualizações no período selecionado",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Data", "Hora", "Página", "Dispositivo", "Browser", "IP", "Referrer", "User Agent"];
    const rows = filteredPageViews.map(pv => [
      new Date(pv.created_at).toLocaleDateString("pt-BR"),
      new Date(pv.created_at).toLocaleTimeString("pt-BR"),
      pv.page_path,
      pv.metadata?.device || "desktop",
      getBrowserInfo(pv.user_agent).name,
      pv.ip_address || "-",
      pv.referrer || "-",
      pv.user_agent || "-",
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
              {searchTerm || deviceFilter !== "all" ? ` (filtrado de ${pageViews.length} total)` : ""}
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dispositivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos dispositivos</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageViews.map((pv) => {
                  const device = pv.metadata?.device || "desktop";
                  const deviceInfo = getDeviceInfo(device);
                  const browserInfo = getBrowserInfo(pv.user_agent);
                  const DeviceIcon = deviceInfo.icon;
                  const BrowserIcon = browserInfo.icon;

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
                        <div className="max-w-xs truncate font-medium" title={pv.page_path}>
                          {pv.page_path}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${deviceInfo.bgColor} ${deviceInfo.color} border-0 gap-1.5`}>
                          <DeviceIcon className="w-3.5 h-3.5" />
                          {device}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="gap-1.5 cursor-help">
                              <BrowserIcon className="w-3.5 h-3.5" />
                              {browserInfo.name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <p className="text-xs break-all">{pv.user_agent || "N/A"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {pv.ip_address || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-xs text-muted-foreground" title={pv.referrer || "-"}>
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