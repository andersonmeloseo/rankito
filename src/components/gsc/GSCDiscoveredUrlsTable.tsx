import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGSCDiscoveredUrls } from '@/hooks/useGSCDiscoveredUrls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';

interface GSCDiscoveredUrlsTableProps {
  siteId: string;
  integrationId?: string;
}

export const GSCDiscoveredUrlsTable = ({ siteId, integrationId }: GSCDiscoveredUrlsTableProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  const { urls, isLoading, totalCount, totalPages } = useGSCDiscoveredUrls(siteId, {
    status: statusFilter,
    searchTerm,
    integrationId,
    page: currentPage,
    pageSize,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, integrationId]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'indexed':
        return <Badge className="bg-green-100 text-green-700">Indexado</Badge>;
      case 'queued':
        return <Badge className="bg-blue-100 text-blue-700">Na Fila</Badge>;
      case 'discovered':
        return <Badge className="bg-yellow-100 text-yellow-700">Descoberto</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Falhou</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg">URLs Descobertas</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalCount.toLocaleString('pt-BR')} URLs totais</Badge>
            <Badge variant="secondary">Página {currentPage} de {totalPages}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="discovered">Descoberto</SelectItem>
              <SelectItem value="queued">Na Fila</SelectItem>
              <SelectItem value="indexed">Indexado</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>URL</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Posição</TableHead>
                <TableHead className="text-center">Última Visualização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls && urls.length > 0 ? (
                urls.map((url) => (
                  <TableRow key={url.id} className="h-16">
                     <TableCell className="font-medium max-w-md">
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline truncate"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{url.url}</span>
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {url.gsc_data && url.indexnow_data ? 'GSC + Sitemap' :
                         url.gsc_data ? 'Search Analytics' :
                         url.indexnow_data ? 'Sitemap' : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(url.current_status)}</TableCell>
                    <TableCell className="text-right">{url.impressions?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right">{url.clicks?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right">
                      {url.ctr ? `${(url.ctr * 100).toFixed(2)}%` : '0%'}
                    </TableCell>
                    <TableCell className="text-right">
                      {url.position ? url.position.toFixed(1) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {url.last_seen_at
                        ? format(new Date(url.last_seen_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma URL descoberta ainda. Execute a descoberta de páginas para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount.toLocaleString('pt-BR')} URLs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i;
                  
                  if (pageNumber < 1 || pageNumber > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className="w-10"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
