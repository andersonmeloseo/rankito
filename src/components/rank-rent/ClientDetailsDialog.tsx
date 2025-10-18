import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, FileText, Calendar, Building, Mail, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

interface ClientPage {
  id: string;
  page_title: string;
  page_url: string;
  page_path: string;
  monthly_rent_value: number;
  status: string;
  site_id: string;
  sites: {
    site_name: string;
    site_url: string;
  };
}

interface ClientDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  niche: string;
  notes: string;
  contract_start_date: string;
  contract_end_date: string;
}

export const ClientDetailsDialog = ({ open, onOpenChange, clientId, clientName }: ClientDetailsDialogProps) => {
  const { data: clientDetails, isLoading: detailsLoading } = useQuery<ClientDetails>({
    queryKey: ["client-details", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: clientPages, isLoading: pagesLoading } = useQuery<ClientPage[]>({
    queryKey: ["client-pages", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_pages")
        .select(`
          *,
          sites:rank_rent_sites(site_name, site_url)
        `)
        .eq("client_id", clientId)
        .order("monthly_rent_value", { ascending: false });

      if (error) throw error;
      return data as unknown as ClientPage[];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente</DialogTitle>
          <DialogDescription>
            Informações completas e páginas alugadas
          </DialogDescription>
        </DialogHeader>

        {detailsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : clientDetails ? (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{clientDetails.name}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {clientDetails.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{clientDetails.email}</span>
                  </div>
                )}
                {clientDetails.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{clientDetails.phone}</span>
                  </div>
                )}
                {clientDetails.company && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{clientDetails.company}</span>
                  </div>
                )}
                {clientDetails.niche && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary">{clientDetails.niche}</Badge>
                  </div>
                )}
              </div>

              {(clientDetails.contract_start_date || clientDetails.contract_end_date) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {clientDetails.contract_start_date && (
                    <span>Início: {new Date(clientDetails.contract_start_date).toLocaleDateString()}</span>
                  )}
                  {clientDetails.contract_end_date && (
                    <span>Fim: {new Date(clientDetails.contract_end_date).toLocaleDateString()}</span>
                  )}
                </div>
              )}

              {clientDetails.notes && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Observações:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{clientDetails.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Client Pages */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Páginas Alugadas</h3>
              
              {pagesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : clientPages && clientPages.length > 0 ? (
                <div className="space-y-2">
                  {clientPages.map((page) => (
                    <div
                      key={page.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {page.page_title || page.page_path}
                            </p>
                            <Badge variant={page.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {page.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {page.sites?.site_name || 'Site'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {page.page_url}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="font-semibold text-success">
                              R$ {Number(page.monthly_rent_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(page.page_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Mensal:</span>
                      <span className="text-lg font-bold text-success">
                        R$ {clientPages.reduce((sum, p) => sum + Number(p.monthly_rent_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma página alugada por este cliente
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};