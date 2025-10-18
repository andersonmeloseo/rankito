import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, Copy, Settings } from "lucide-react";
import { useState } from "react";
import { AddClientDialog } from "./AddClientDialog";
import { AssignPagesToClientDialog } from "./AssignPagesToClientDialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientsListProps {
  userId: string;
}

interface ClientMetric {
  client_id: string;
  client_name: string;
  email: string;
  phone: string;
  company: string;
  niche?: string;
  contract_start_date: string;
  contract_end_date: string;
  created_at: string;
  updated_at: string;
  access_token: string;
  total_pages_rented: number;
  total_monthly_value: number;
  total_page_views: number;
  total_conversions: number;
}

export const ClientsList = ({ userId }: ClientsListProps) => {
  const { toast } = useToast();
  const [showAddClient, setShowAddClient] = useState(false);
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [managingClientId, setManagingClientId] = useState<string | null>(null);
  const [managingClientName, setManagingClientName] = useState<string>("");

  const { data: clients, isLoading } = useQuery<ClientMetric[]>({
    queryKey: ["rank-rent-clients", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_client_metrics")
        .select("*")
        .order("total_monthly_value", { ascending: false });

      if (error) throw error;
      return data as ClientMetric[];
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

  const uniqueNiches = Array.from(new Set(clients?.map(c => c.niche).filter(Boolean)));
  const filteredClients = nicheFilter === "all" 
    ? clients 
    : clients?.filter(c => c.niche === nicheFilter);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {uniqueNiches.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por nicho:</span>
          <Select value={nicheFilter} onValueChange={setNicheFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os nichos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os nichos</SelectItem>
              {uniqueNiches.map((niche) => (
                <SelectItem key={niche} value={niche}>
                  {niche}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4">
        {filteredClients?.map((client) => (
          <div
            key={client.client_id}
            className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{client.client_name}</h3>
                  {client.niche && (
                    <Badge variant="secondary" className="text-xs">
                      {client.niche}
                    </Badge>
                  )}
                </div>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setManagingClientId(client.client_id);
                    setManagingClientName(client.client_name);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar Páginas
                </Button>
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

            {client.total_pages_rented === 0 && (
              <div className="mb-4 p-3 bg-muted rounded-md border-l-4 border-amber-500">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Este cliente ainda não possui páginas vinculadas
                </p>
              </div>
            )}

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

      {managingClientId && (
        <AssignPagesToClientDialog
          clientId={managingClientId}
          clientName={managingClientName}
          open={!!managingClientId}
          onOpenChange={(open) => {
            if (!open) {
              setManagingClientId(null);
              setManagingClientName("");
            }
          }}
        />
      )}
    </div>
  );
};