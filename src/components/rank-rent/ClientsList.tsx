import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, Copy } from "lucide-react";
import { useState } from "react";
import { AddClientDialog } from "./AddClientDialog";
import { useToast } from "@/hooks/use-toast";

interface ClientsListProps {
  userId: string;
}

export const ClientsList = ({ userId }: ClientsListProps) => {
  const { toast } = useToast();
  const [showAddClient, setShowAddClient] = useState(false);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["rank-rent-clients", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_client_metrics")
        .select("*")
        .order("total_monthly_value", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const copyReportLink = (token: string) => {
    const reportUrl = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: "Link copiado!",
      description: "Link do relatório copiado para área de transferência",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
        <p className="text-muted-foreground mb-4">
          Comece adicionando seu primeiro cliente
        </p>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cliente
        </Button>
        <AddClientDialog
          open={showAddClient}
          onOpenChange={setShowAddClient}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <div
            key={client.client_id}
            className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{client.client_name}</h3>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
              </div>
              <div className="flex gap-2">
                {client.access_token && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/report/${client.access_token}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Relatório
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyReportLink(client.access_token)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Páginas Alugadas</p>
                <p className="text-2xl font-bold">{client.total_pages_rented || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-2xl font-bold text-success">
                  R$ {Number(client.total_monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{client.total_page_views || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold text-primary">{client.total_conversions || 0}</p>
              </div>
            </div>

            {(client.contract_start_date || client.contract_end_date) && (
              <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                {client.contract_start_date && (
                  <span>Início: {new Date(client.contract_start_date).toLocaleDateString()}</span>
                )}
                {client.contract_end_date && (
                  <span>Fim: {new Date(client.contract_end_date).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <AddClientDialog
        open={showAddClient}
        onOpenChange={setShowAddClient}
      />
    </div>
  );
};