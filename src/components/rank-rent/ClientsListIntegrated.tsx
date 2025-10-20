import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, LayoutGrid, Table as TableIcon, Filter, Users } from "lucide-react";
import { useClientIntegration, ClientWithPortalStatus } from "@/hooks/useClientIntegration";
import { ClientCard } from "./ClientCard";
import { ClientsTable } from "./ClientsTable";
import { AddClientDialog } from "./AddClientDialog";
import { EditClientDialog } from "./EditClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { ClientManageAccessDialog } from "./ClientManageAccessDialog";
import { ClientsOverviewCards } from "./ClientsOverviewCards";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientsListIntegratedProps {
  userId: string;
}

export const ClientsListIntegrated = ({ userId }: ClientsListIntegratedProps) => {
  const { clients, isLoading, togglePortal, copyPortalLink, openPortal } = useClientIntegration(userId);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showManageAccess, setShowManageAccess] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithPortalStatus | null>(null);
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Nenhum cliente cadastrado</h3>
        <p className="text-muted-foreground mb-4">
          Comece adicionando seu primeiro cliente e configure o portal de analytics
        </p>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cliente
        </Button>
        <AddClientDialog open={showAddClient} onOpenChange={setShowAddClient} />
      </div>
    );
  }

  const uniqueNiches = Array.from(new Set(clients?.map((c) => c.niche).filter(Boolean)));

  // Filter logic
  const filteredClients = clients?.filter((client) => {
    const matchesNiche = nicheFilter === "all" || client.niche === nicheFilter;
    const matchesSearch =
      searchQuery === "" ||
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== "all" && client.contract_end_date) {
      const daysUntilEnd = Math.ceil(
        (new Date(client.contract_end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );

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

  // Convert ClientWithPortalStatus to ClientMetric for legacy components
  const convertToClientMetric = (client: ClientWithPortalStatus) => ({
    client_id: client.client_id,
    client_name: client.client_name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    niche: client.niche,
    contract_start_date: client.contract_start_date,
    contract_end_date: client.contract_end_date,
    created_at: client.created_at,
    updated_at: client.updated_at,
    total_pages_rented: client.total_pages,
    total_monthly_value: client.total_monthly_value,
    total_page_views: client.page_views_30d,
    total_conversions: client.conversions_30d,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clientes & Portais</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie clientes, portais analíticos e acessos em um só lugar
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddClient(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "grid" | "table")}
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Overview Cards */}
      <ClientsOverviewCards clients={clients.map(convertToClientMetric)} />

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
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="expiring">Vencendo</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
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
                  <SelectItem key={niche} value={niche!}>
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
            Exibindo {filteredClients.length} de {clients.length}{" "}
            {clients.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>
      )}

      {/* View: Grid or Table */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients?.map((client) => (
            <ClientCard
              key={client.client_id}
              client={client}
              onEdit={() => {
                setSelectedClient(client);
                setShowEditClient(true);
              }}
              onDelete={() => {
                setSelectedClient(client);
                setShowDeleteClient(true);
              }}
              onOpenPortal={() => openPortal(client)}
              onManageAccess={() => {
                setSelectedClient(client);
                setShowManageAccess(true);
              }}
              onViewDetails={() => {
                setSelectedClient(client);
                setShowClientDetails(true);
              }}
              onCopyLink={() => copyPortalLink(client)}
              onViewReport={() => {
                // TODO: Implement report view
                window.open(`/report/${client.portal_token}`, "_blank");
              }}
            />
          ))}
        </div>
      ) : (
        <ClientsTable
          clients={filteredClients.map(convertToClientMetric)}
          onEdit={(client) => {
            const fullClient = clients.find((c) => c.client_id === client.client_id);
            if (fullClient) {
              setSelectedClient(fullClient);
              setShowEditClient(true);
            }
          }}
          onDelete={(client) => {
            const fullClient = clients.find((c) => c.client_id === client.client_id);
            if (fullClient) {
              setSelectedClient(fullClient);
              setShowDeleteClient(true);
            }
          }}
          onViewDetails={(client) => {
            const fullClient = clients.find((c) => c.client_id === client.client_id);
            if (fullClient) {
              setSelectedClient(fullClient);
              setShowClientDetails(true);
            }
          }}
          onViewReport={(token) => window.open(`/report/${token}`, "_blank")}
          onCopyLink={(token) => {}} // Not used in integrated view
          onCopyPortalLink={(clientId) => {
            const client = clients.find((c) => c.client_id === clientId);
            if (client) copyPortalLink(client);
          }}
        />
      )}

      {/* Dialogs */}
      <AddClientDialog open={showAddClient} onOpenChange={setShowAddClient} />

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
            totalPagesRented={selectedClient.total_pages}
          />

          <ClientDetailsDialog
            open={showClientDetails}
            onOpenChange={setShowClientDetails}
            clientId={selectedClient.client_id}
            clientName={selectedClient.client_name}
          />

          <ClientManageAccessDialog
            open={showManageAccess}
            onOpenChange={setShowManageAccess}
            client={selectedClient}
            onTogglePortal={(enabled) =>
              togglePortal.mutate({ clientId: selectedClient.client_id, enabled })
            }
          />
        </>
      )}
    </div>
  );
};
