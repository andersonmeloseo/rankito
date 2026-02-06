import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Edit, ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { EditPageDialog } from "./EditPageDialog";

interface PagesListProps {
  userId: string;
  siteId?: string;
  clientId?: string;
}

export const PagesList = ({ userId, siteId, clientId }: PagesListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("total_page_views");
  const [sortAscending, setSortAscending] = useState(false);
  const [loadedCount, setLoadedCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Query para contar total de páginas (rápida, sem agregações)
  const { data: totalCount } = useQuery({
    queryKey: ["rank-rent-pages-count", userId, siteId, clientId],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_pages")
        .select("id", { count: "exact", head: true });

      if (siteId) {
        query = query.eq("site_id", siteId);
      }
      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { count } = await query;
      return count || 0;
    },
  });

  // Query principal com paginação no servidor
  const { data: pages, isLoading, refetch } = useQuery({
    queryKey: ["rank-rent-pages", userId, siteId, clientId, loadedCount],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_page_metrics")
        .select("*")
        .range(0, loadedCount - 1);

      if (siteId) {
        query = query.eq("site_id", siteId);
      }
      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      query = query.order("total_page_views", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
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
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setLoadedCount(prev => prev + 100);
  };

  // Quando loadedCount mudar, refetch será chamado automaticamente pelo react-query
  // devido à queryKey incluir loadedCount

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortAscending ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Filtrar páginas pelo termo de busca
  const filteredPages = useMemo(() => {
    if (!pages) return [];
    return pages.filter((page) =>
      page.page_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.page_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  // Ordenar páginas
  const sortedPages = useMemo(() => {
    if (!filteredPages) return [];
    
    return [...filteredPages].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortAscending ? -1 : 1;
      if (aVal > bVal) return sortAscending ? 1 : -1;
      return 0;
    });
  }, [filteredPages, sortColumn, sortAscending]);

  // Reset isLoadingMore quando os dados chegarem
  useMemo(() => {
    if (!isLoading) {
      setIsLoadingMore(false);
    }
  }, [isLoading, pages]);

  const hasMoreToLoad = totalCount !== undefined && loadedCount < totalCount;
  const remainingCount = totalCount ? totalCount - loadedCount : 0;

  if (isLoading && loadedCount === 10) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <Input
          placeholder="Buscar por URL ou título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {sortedPages?.length || 0} de {totalCount || 0} páginas carregadas
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="table-auto">
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="min-w-[280px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("page_title")}
                >
                  <div className="flex items-center gap-2">
                    Página
                    <SortIcon column="page_title" />
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[150px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("site_name")}
                >
                  <div className="flex items-center gap-2">
                    Site
                    <SortIcon column="site_name" />
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("client_name")}
                >
                  <div className="flex items-center gap-2">
                    Cliente
                    <SortIcon column="client_name" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("total_page_views")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Page Views
                    <SortIcon column="total_page_views" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("total_conversions")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Conversões
                    <SortIcon column="total_conversions" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right min-w-[90px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("conversion_rate")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Taxa Conv.
                    <SortIcon column="conversion_rate" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("avg_time_on_page")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Tempo Médio
                    <SortIcon column="avg_time_on_page" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right min-w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("monthly_rent_value")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Valor Mensal
                    <SortIcon column="monthly_rent_value" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-center min-w-[90px] cursor-pointer hover:bg-muted/50 select-none"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <SortIcon column="status" />
                  </div>
                </TableHead>
                <TableHead className="text-center min-w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPages && sortedPages.length > 0 ? (
                sortedPages.map((page) => (
                <TableRow key={page.page_id} className="hover:bg-muted/50 transition-colors group">
                  <TableCell className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="font-medium truncate">{page.page_title || page.page_path}</div>
                      <div className="text-xs text-muted-foreground truncate">{page.page_url}</div>
                      {page.phone_number && (
                        <div className="text-xs text-primary mt-1">📞 {page.phone_number}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm">{page.site_name}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {page.client_name ? (
                      <Badge variant="outline" className="bg-success/10 text-success">
                        {page.client_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disponível</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-4 py-3">{page.total_page_views || 0}</TableCell>
                  <TableCell className="text-right font-semibold px-4 py-3">{page.total_conversions || 0}</TableCell>
                  <TableCell className="text-right px-4 py-3">{page.conversion_rate || 0}%</TableCell>
                  <TableCell className="text-right px-4 py-3">
                    {page.avg_time_on_page ? (
                      <span className="text-sm">
                        {Math.floor(page.avg_time_on_page / 60)}:
                        {(page.avg_time_on_page % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-4 py-3">
                    R$ {Number(page.monthly_rent_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center px-4 py-3">
                    <Badge
                      variant={page.status === 'active' ? 'default' : 'secondary'}
                    >
                      {page.status === 'active' ? 'Ativa' : page.status === 'inactive' ? 'Inativa' : 'Revisar'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center px-4 py-3">
                    <div className="flex gap-2 justify-center items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(page.page_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPage(page)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground px-4">
                  Nenhuma página encontrada
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </div>

        {/* Load More Button */}
        {hasMoreToLoad && (
          <div className="flex justify-center py-6 border-t">
            <Button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="min-w-[280px]"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  Carregar Mais
                  <Badge variant="secondary" className="ml-2">
                    +{Math.min(100, remainingCount)} de {remainingCount} restantes
                  </Badge>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Info quando todas foram carregadas */}
        {!hasMoreToLoad && sortedPages.length > 0 && (
          <div className="flex justify-center py-4 border-t text-sm text-muted-foreground">
            Todas as {totalCount} páginas foram carregadas
          </div>
        )}
      </div>

      {selectedPage && (
        <EditPageDialog
          page={selectedPage}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </div>
  );
};
