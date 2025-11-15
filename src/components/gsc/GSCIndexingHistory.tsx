import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Search, Download, RefreshCw } from "lucide-react";
import { useGSCIndexingHistory, useGSCIndexingStats, GSCIndexingHistoryFilters } from "@/hooks/useGSCIndexingHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface GSCIndexingHistoryProps {
  siteId: string;
}

export const GSCIndexingHistory = ({ siteId }: GSCIndexingHistoryProps) => {
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [filters, setFilters] = useState<GSCIndexingHistoryFilters>({});
  const [searchInput, setSearchInput] = useState("");

  const { data: historyData, isLoading, refetch } = useGSCIndexingHistory({
    siteId,
    filters,
    page,
    perPage
  });

  const { data: stats, isLoading: isLoadingStats } = useGSCIndexingStats(siteId);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchTerm: searchInput }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof GSCIndexingHistoryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
    setPage(1);
  };

  const handleExport = () => {
    // Simplified export - in production, you'd want to fetch all data
    toast.info("Exportação em desenvolvimento");
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">Aguardando</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'URL_UPDATED':
        return 'Atualização';
      case 'URL_DELETED':
        return 'Remoção';
      default:
        return type;
    }
  };

  const getRelativeUrl = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  if (isLoading || isLoadingStats) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Histórico de Indexação</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">URLs Hoje</p>
            <p className="text-2xl font-bold">{stats?.todayTotal || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
            <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tempo Médio</p>
            <p className="text-2xl font-bold">{stats?.avgResponseTime || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Falhas</p>
            <p className="text-2xl font-bold">{stats?.todayFailed || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar URL..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="success">Concluído</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.startDate ? 'custom' : 'all'} 
            onValueChange={(value) => {
              if (value === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setFilters(prev => ({ ...prev, startDate: today.toISOString() }));
              } else if (value === '7days') {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                setFilters(prev => ({ ...prev, startDate: date.toISOString() }));
              } else if (value === '30days') {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                setFilters(prev => ({ ...prev, startDate: date.toISOString() }));
              } else {
                setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
              }
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conta GSC Utilizada</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData?.requests && historyData.requests.length > 0 ? (
                historyData.requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm max-w-[300px] truncate">
                      <a 
                        href={request.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary flex items-center gap-1"
                        title={request.url}
                      >
                        {getRelativeUrl(request.url)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.used_integration ? (
                          <>
                            <div className="font-medium">
                              {request.used_integration.connection_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {request.used_integration.google_email}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getRequestTypeLabel(request.request_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'failed' && request.error_message ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.error(request.error_message || "Erro desconhecido")}
                        >
                          Ver Erro
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma requisição encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {historyData && historyData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * perPage) + 1} a {Math.min(page * perPage, historyData.totalCount)} de {historyData.totalCount} requisições
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </Button>
              <div className="flex items-center gap-2 px-3">
                <span className="text-sm">
                  Página {page} de {historyData.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(historyData.totalPages, p + 1))}
                disabled={page >= historyData.totalPages}
              >
                Próxima →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
