import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCDiscoveredUrls } from "@/hooks/useGSCDiscoveredUrls";
import { ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface GSCDiscoveredUrlsTableProps {
  siteId: string;
}

export function GSCDiscoveredUrlsTable({ siteId }: GSCDiscoveredUrlsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data: urls, isLoading } = useGSCDiscoveredUrls({
    siteId,
    status: statusFilter,
    limit: 100,
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      indexed: { variant: "default" as const, icon: CheckCircle, label: "Indexada", color: "text-green-600" },
      sent_for_indexing: { variant: "secondary" as const, icon: Clock, label: "Enviada", color: "text-blue-600" },
      failed: { variant: "destructive" as const, icon: XCircle, label: "Falhou", color: "text-red-600" },
      not_indexed: { variant: "outline" as const, icon: HelpCircle, label: "Não Indexada", color: "text-gray-600" },
      unknown: { variant: "outline" as const, icon: HelpCircle, label: "Desconhecido", color: "text-gray-400" },
    };

    const config = variants[status as keyof typeof variants] || variants.unknown;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: urls?.length || 0,
    indexed: urls?.filter(u => u.gsc_data).length || 0,
    inSitemap: urls?.filter(u => u.sitemap_found).length || 0,
    failed: urls?.filter(u => u.current_status === 'failed').length || 0,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>URLs Descobertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>URLs Descobertas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} URLs • {stats.indexed} indexadas no GSC • {stats.inSitemap} no sitemap
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter(undefined)}
              className={!statusFilter ? 'bg-muted' : ''}
            >
              Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('indexed')}
              className={statusFilter === 'indexed' ? 'bg-muted' : ''}
            >
              Indexadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('failed')}
              className={statusFilter === 'failed' ? 'bg-muted' : ''}
            >
              Falhas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!urls || urls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma URL descoberta ainda</p>
            <p className="text-sm mt-2">Execute a descoberta de páginas GSC para popular esta tabela</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urls.map((url) => (
                  <TableRow key={url.id}>
                    <TableCell className="font-mono text-xs max-w-md truncate">
                      {url.url}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(url.current_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {url.gsc_data && (
                          <Badge variant="outline" className="text-xs">
                            GSC
                          </Badge>
                        )}
                        {url.sitemap_found && (
                          <Badge variant="outline" className="text-xs">
                            Sitemap
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {url.updated_at ? formatDistanceToNow(new Date(url.updated_at), {
                        addSuffix: true,
                        locale: ptBR,
                      }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(url.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
