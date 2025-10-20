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
import { ExternalLink, FileText, Calendar, Building, Mail, Phone, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GeneratePortalLinkButton } from "./GeneratePortalLinkButton";

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

            {/* Portal Analítico */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Portal Analítico do Cliente
              </h3>
              <GeneratePortalLinkButton
                clientId={clientId}
                clientName={clientDetails.name}
              />
            </div>

          {/* Só mostra separador e seção se houver páginas ou estiver carregando */}
          {(pagesLoading || (clientPages && clientPages.length > 0)) && (
            <>
              <Separator />

              {/* Client Pages */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Páginas Alugadas</h3>
                
                {pagesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientPages?.map((page) => (
                      <div key={page.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{page.page_title || "Sem título"}</h4>
                              <Badge variant={page.status === "active" ? "default" : "secondary"}>
                                {page.status === "active" ? "Ativa" : "Inativa"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground break-all">
                              {page.page_url}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Site:</span>{" "}
                              <span className="font-medium">{page.sites.site_name}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="font-semibold text-primary">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Number(page.monthly_rent_value) || 0)}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(page.page_url, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Visitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Mensal:</span>
                        <span className="text-lg font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(
                            clientPages?.reduce((sum, page) => sum + (Number(page.monthly_rent_value) || 0), 0) || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};