import { TableRow, TableCell, Table, TableHeader, TableHead, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserResources } from "@/hooks/useUserResources";
import { Skeleton } from "@/components/ui/skeleton";

interface UserResourcesExpandableRowProps {
  userId: string;
}

export const UserResourcesExpandableRow = ({ userId }: UserResourcesExpandableRowProps) => {
  const { data, isLoading } = useUserResources(userId);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={11}>
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!data || data.sites.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={11}>
          <div className="p-4 text-center text-muted-foreground">
            Este usuário não possui sites cadastrados
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={11}>
        <div className="p-4 bg-muted/30 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Sites Cadastrados</h4>
            <Badge variant="outline">{data.sites.length} site{data.sites.length !== 1 ? 's' : ''}</Badge>
          </div>
          
          {/* Sites Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead className="text-right">URLs</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">GSC</TableHead>
                <TableHead className="text-right">Indexações (30d)</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sites.map(site => (
                <TableRow key={site.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{site.site_name}</div>
                      <a 
                        href={site.site_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {site.site_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{site.niche}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {site.total_pages.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {site.total_conversions.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {site.gsc_integrations_count > 0 ? (
                      <Badge variant="default">{site.gsc_integrations_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      <span className="font-medium">{site.recent_indexing_requests.toLocaleString('pt-BR')}</span>
                      <span className="text-muted-foreground">
                        /{(site.gsc_integrations_count * 200).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(site.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Summary Footer */}
          <div className="flex gap-6 pt-2 border-t text-sm">
            <div>
              <span className="text-muted-foreground">Total de Páginas:</span>
              <span className="font-semibold ml-2">{data.summary.totalPages.toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total de Conversões:</span>
              <span className="font-semibold ml-2">{data.summary.totalConversions.toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Integrações GSC:</span>
              <span className="font-semibold ml-2">{data.summary.totalGscIntegrations}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Requisições de Indexação:</span>
              <span className="font-semibold ml-2">{data.summary.totalIndexingRequests.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};
