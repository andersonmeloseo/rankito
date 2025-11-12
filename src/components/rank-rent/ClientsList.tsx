import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Filter } from "lucide-react";
import { useState } from "react";
import { AddClientDialog } from "./AddClientDialog";
import { EditClientDialog } from "./EditClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { ClientsOverviewCards } from "./ClientsOverviewCards";
import { ClientsTable } from "./ClientsTable";
import { useToast } from "@/hooks/use-toast";
import { usePortalToken } from "@/hooks/usePortalToken";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ClientsListProps {
  userId: string;
}

interface ClientMetric {
  client_id: string;
  client_name: string;
  email?: string;
  phone?: string;
  company?: string;
  niche?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  created_at?: string;
  updated_at?: string;
  access_token?: string;
  total_pages_rented?: number;
  total_monthly_value?: number;
  total_page_views?: number;
  total_conversions?: number;
}

export const ClientsList = ({ userId }: ClientsListProps) => {
  const { toast } = useToast();
  const { generatePortalLink, getPortalByClient } = usePortalToken();
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientMetric | null>(null);
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: clients, isLoading } = useQuery<ClientMetric[]>({
    queryKey: ["rank-rent-clients", userId],
    queryFn: async () => {
      // Fetch clients with user filter
      const { data: clientsData, error: clientsError } = await supabase
        .from("rank_rent_clients")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch metrics for each client
      const clientsWithMetrics = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: sitesData } = await supabase
            .from("rank_rent_sites")
            .select("id, monthly_rent_value")
            .eq("client_id", client.id)
            .eq("is_rented", true);

          const { data: pagesData } = await supabase
            .from("rank_rent_pages")
            .select("id")
            .eq("client_id", client.id)
            .eq("is_rented", true);

          const { data: statsData } = await supabase
            .from("rank_rent_daily_stats")
            .select("page_views, conversions")
            .eq("client_id", client.id);

          const totalMonthlyValue = sitesData?.reduce((sum, site) => sum + Number(site.monthly_rent_value || 0), 0) || 0;
          const totalPageViews = statsData?.reduce((sum, stat) => sum + Number(stat.page_views || 0), 0) || 0;
          const totalConversions = statsData?.reduce((sum, stat) => sum + Number(stat.conversions || 0), 0) || 0;

          return {
            client_id: client.id,
            client_name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            niche: client.niche,
            contract_start_date: client.contract_start_date,
            contract_end_date: client.contract_end_date,
            created_at: client.created_at,
            updated_at: client.updated_at,
            access_token: client.access_token,
            total_pages_rented: pagesData?.length || 0,
            total_monthly_value: totalMonthlyValue,
            total_page_views: totalPageViews,
            total_conversions: totalConversions,
          };
        })
      );

      return clientsWithMetrics.sort((a, b) => b.total_monthly_value - a.total_monthly_value) as ClientMetric[];
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
    const reportUrl = `${import.meta.env.VITE_APP_URL}/report/${token}`;
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: "Link copiado!",
      description: "Link do relatório copiado para área de transferência",
    });
  };

  const handleGeneratePortalLink = async (clientId: string) => {
    try {
      const existingPortal = await getPortalByClient(clientId);
      
      if (existingPortal) {
        const portalUrl = `${import.meta.env.VITE_APP_URL}/client-portal/${existingPortal.portal_token}`;
        navigator.clipboard.writeText(portalUrl);
        toast({
          title: "Link do portal copiado!",
          description: "Link do portal analítico copiado para área de transferência",
        });
      } else {
        const portal = await generatePortalLink(clientId);
        const portalUrl = `${import.meta.env.VITE_APP_URL}/client-portal/${portal.portal_token}`;
        navigator.clipboard.writeText(portalUrl);
        toast({
          title: "Portal criado e link copiado!",
          description: "Portal analítico criado e link copiado para área de transferência",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar portal",
        description: "Não foi possível gerar o link do portal",
        variant: "destructive",
      });
    }
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
  
  // Filter by niche, status and search query
  const filteredClients = clients?.filter(client => {
    const matchesNiche = nicheFilter === "all" || client.niche === nicheFilter;
    const matchesSearch = searchQuery === "" || 
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter logic
    let matchesStatus = true;
    if (statusFilter !== "all" && client.contract_end_date) {
      const daysUntilEnd = Math.ceil((new Date(client.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (statusFilter === "active") {
        matchesStatus = daysUntilEnd > 30;
      } else if (statusFilter === "expiring") {
        matchesStatus = daysUntilEnd >= 0 && daysUntilEnd <= 30;
      } else if (statusFilter === "expired") {
        matchesStatus = daysUntilEnd < 0;
      }
    }
    
    return matchesNiche && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus clientes e contratos
          </p>
        </div>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Overview Cards */}
      <ClientsOverviewCards clients={clients} />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                  Ativos
                </div>
              </SelectItem>
              <SelectItem value="expiring">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full" />
                  Vencendo
                </div>
              </SelectItem>
              <SelectItem value="expired">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                  Vencidos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {uniqueNiches.length > 0 && (
            <Select value={nicheFilter} onValueChange={setNicheFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Nicho" />
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
      </div>

      {/* Results count */}
      {filteredClients && filteredClients.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>
            Exibindo {filteredClients.length} de {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
          </span>
        </div>
      )}

        {/* Clients Table */}
        {filteredClients && filteredClients.length > 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <ClientsTable
                  clients={filteredClients}
                  onEdit={(client) => {
                    setSelectedClient(client);
                    setShowEditClient(true);
                  }}
                  onDelete={(client) => {
                    setSelectedClient(client);
                    setShowDeleteClient(true);
                  }}
                  onViewDetails={(client) => {
                    setSelectedClient(client);
                    setShowClientDetails(true);
                  }}
                  onViewReport={(token) => window.open(`/report/${token}`, '_blank')}
                  onCopyLink={copyReportLink}
                  onCopyPortalLink={(clientId) => handleGeneratePortalLink(clientId)}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="text-center py-12 border rounded-lg">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || nicheFilter !== "all" || statusFilter !== "all"
              ? "Tente ajustar os filtros de busca"
              : "Comece adicionando seu primeiro cliente"}
          </p>
          {!searchQuery && nicheFilter === "all" && statusFilter === "all" && (
            <Button onClick={() => setShowAddClient(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cliente
            </Button>
          )}
        </div>
      )}

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