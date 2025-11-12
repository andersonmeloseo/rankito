import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Edit, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["rank-rent-pages", userId, siteId, clientId],
    queryFn: async () => {
      let query = supabase
        .from("rank_rent_page_metrics")
        .select("*");

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
    refetchInterval: 30000,
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

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortAscending ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = Number(newSize);
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filtrar páginas
  const filteredPages = pages?.filter((page) =>
    page.page_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Paginar páginas
  const paginatedPages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    
    if (pageSize === 99999) return sortedPages;
    
    return sortedPages.slice(startIndex, startIndex + pageSize);
  }, [sortedPages, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedPages.length / pageSize);

  if (isLoading) {
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
          {sortedPages?.length || 0} páginas encontradas
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
              {paginatedPages && paginatedPages.length > 0 ? (
                paginatedPages.map((page) => (
                <TableRow key={page.page_id}>
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
                    <div className="flex gap-2 justify-center">
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

        {/* Pagination Controls */}
        {sortedPages.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {pageSize === 99999 ? sortedPages.length : Math.min(((currentPage - 1) * pageSize) + 1, sortedPages.length)}-{pageSize === 99999 ? sortedPages.length : Math.min(currentPage * pageSize, sortedPages.length)} de {sortedPages.length} páginas
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-40">
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
              
              {pageSize !== 99999 && (
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
              )}
            </div>
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