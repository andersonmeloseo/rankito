import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ExternalLink, Copy, MoreVertical, Edit, Trash2, FileText, TrendingUp, Users, DollarSign, Eye, Search, Mail, Phone, Building } from "lucide-react";
import { useState } from "react";
import { AddClientDialog } from "./AddClientDialog";
import { EditClientDialog } from "./EditClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
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
  const [showEditClient, setShowEditClient] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientMetric | null>(null);
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Get client full data for edit
  const { data: clientFullData } = useQuery({
    queryKey: ["client-full-data", selectedClient?.client_id],
    queryFn: async () => {
      if (!selectedClient?.client_id) return null;
      const { data, error } = await supabase
        .from("rank_rent_clients")
        .select("*")
        .eq("id", selectedClient.client_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient?.client_id && showEditClient,
  });

  const copyReportLink = (token: string) => {
    const reportUrl = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: "Link copiado!",
      description: "Link do relatório copiado para área de transferência",
    });
  };

  const getContractStatus = (endDate: string) => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd < 0) {
      return { label: "Vencido", variant: "destructive" as const, color: "text-destructive" };
    } else if (daysUntilEnd <= 30) {
      return { label: "Vence em breve", variant: "secondary" as const, color: "text-warning" };
    } else {
      return { label: "Ativo", variant: "default" as const, color: "text-success" };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
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
  
  // Filter by niche and search query
  const filteredClients = clients?.filter(client => {
    const matchesNiche = nicheFilter === "all" || client.niche === nicheFilter;
    const matchesSearch = searchQuery === "" || 
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesNiche && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {uniqueNiches.length > 0 && (
          <Select value={nicheFilter} onValueChange={setNicheFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por nicho" />
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
        )}
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4">
        {filteredClients?.map((client) => {
          const contractStatus = getContractStatus(client.contract_end_date);
          
          return (
            <div
              key={client.client_id}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-200"
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(client.client_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold truncate">{client.client_name}</h3>
                        {client.niche && (
                          <Badge variant="secondary" className="text-xs">
                            {client.niche}
                          </Badge>
                        )}
                        {contractStatus && (
                          <Badge variant={contractStatus.variant} className="text-xs">
                            {contractStatus.label}
                          </Badge>
                        )}
                      </div>
                      {client.company && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{client.company}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client);
                            setShowClientDetails(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client);
                            setShowEditClient(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Cliente
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.access_token && (
                          <>
                            <DropdownMenuItem
                              onClick={() => window.open(`/report/${client.access_token}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver Relatório
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => copyReportLink(client.access_token)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDeleteClient(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Páginas</p>
                        <p className="text-lg font-bold">{client.total_pages_rented || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-success/10">
                        <DollarSign className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor/Mês</p>
                        <p className="text-lg font-bold text-success">
                          R$ {Number(client.total_monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-blue-500/10">
                        <Eye className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Views</p>
                        <p className="text-lg font-bold">{client.total_page_views || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-purple-500/10">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversões</p>
                        <p className="text-lg font-bold">{client.total_conversions || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contract Dates */}
                  {(client.contract_start_date || client.contract_end_date) && (
                    <div className="mt-4 pt-4 border-t flex gap-4 text-xs text-muted-foreground">
                      {client.contract_start_date && (
                        <span>Início: {new Date(client.contract_start_date).toLocaleDateString()}</span>
                      )}
                      {client.contract_end_date && (
                        <span className={contractStatus?.color}>
                          Fim: {new Date(client.contract_end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <AddClientDialog
        open={showAddClient}
        onOpenChange={setShowAddClient}
      />

      {selectedClient && clientFullData && (
        <EditClientDialog
          open={showEditClient}
          onOpenChange={setShowEditClient}
          clientId={selectedClient.client_id}
          initialData={{
            name: clientFullData.name || "",
            email: clientFullData.email || "",
            phone: clientFullData.phone || "",
            company: clientFullData.company || "",
            niche: clientFullData.niche || "",
            contract_start_date: clientFullData.contract_start_date || "",
            contract_end_date: clientFullData.contract_end_date || "",
            notes: clientFullData.notes || "",
          }}
        />
      )}

      {selectedClient && (
        <>
          <DeleteClientDialog
            open={showDeleteClient}
            onOpenChange={setShowDeleteClient}
            clientId={selectedClient.client_id}
            clientName={selectedClient.client_name}
            totalPagesRented={selectedClient.total_pages_rented}
          />

          <ClientDetailsDialog
            open={showClientDetails}
            onOpenChange={setShowClientDetails}
            clientId={selectedClient.client_id}
            clientName={selectedClient.client_name}
          />
        </>
      )}
    </div>
  );
};