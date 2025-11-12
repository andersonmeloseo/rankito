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
import { ExternalLink, Edit } from "lucide-react";
import { useState } from "react";
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

  const filteredPages = pages?.filter((page) =>
    page.page_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.page_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditPage = (page: any) => {
    setSelectedPage(page);
    setShowEditDialog(true);
  };

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
          {filteredPages?.length || 0} páginas encontradas
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Página</TableHead>
                <TableHead className="min-w-[150px]">Site</TableHead>
                <TableHead className="min-w-[120px]">Cliente</TableHead>
                <TableHead className="text-right min-w-[100px]">Page Views</TableHead>
                <TableHead className="text-right min-w-[100px]">Conversões</TableHead>
                <TableHead className="text-right min-w-[90px]">Taxa Conv.</TableHead>
                <TableHead className="text-right min-w-[100px]">Tempo Médio</TableHead>
                <TableHead className="text-right min-w-[120px]">Valor Mensal</TableHead>
                <TableHead className="text-center min-w-[90px]">Status</TableHead>
                <TableHead className="text-center min-w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredPages && filteredPages.length > 0 ? (
              filteredPages.map((page) => (
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