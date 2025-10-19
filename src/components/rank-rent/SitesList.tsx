import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, FolderOpen, Pencil, MoreVertical, Play, RefreshCw, Search, Eye, Phone, FileText, TrendingUp, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EditSiteWithRentalDialog } from "./EditSiteWithRentalDialog";
import { RentSiteDialog } from "./RentSiteDialog";
import { RenewContractDialog } from "./RenewContractDialog";
import { UnrentSiteDialog } from "./UnrentSiteDialog";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { useContractStatus } from "@/hooks/useContractStatus";

interface SitesListProps {
  userId: string;
}

export const SitesList = ({ userId }: SitesListProps) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRentDialog, setShowRentDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showUnrentDialog, setShowUnrentDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");

  const handleEdit = (site: any) => {
    setSelectedSite(site);
    setShowEditDialog(true);
  };

  const handleRent = (site: any) => {
    setSelectedSite(site);
    setShowRentDialog(true);
  };

  const handleRenew = (site: any) => {
    setSelectedSite(site);
    setShowRenewDialog(true);
  };

  const handleUnrent = (site: any) => {
    setSelectedSite(site);
    setShowUnrentDialog(true);
  };

  const { data: sites, isLoading } = useQuery({
    queryKey: ["rank-rent-site-metrics", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_site_metrics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Get unique niches for filter
  const uniqueNiches = [...new Set(sites?.map(s => s.niche).filter(Boolean))];

  // Filter sites
  const filteredSites = sites?.filter((site) => {
    const matchesSearch = searchTerm === "" || 
      site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.site_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.niche?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "rented") {
      matchesStatus = site.is_rented === true;
    } else if (statusFilter === "available") {
      matchesStatus = site.is_rented === false;
    } else if (statusFilter === "expiring") {
      if (!site.is_rented || !site.contract_end_date) {
        matchesStatus = false;
      } else {
        const daysUntilExpiration = Math.floor(
          (new Date(site.contract_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        matchesStatus = daysUntilExpiration >= 0 && daysUntilExpiration <= 30;
      }
    } else if (statusFilter === "expired") {
      matchesStatus = site.is_rented && site.contract_end_date && new Date(site.contract_end_date) < new Date();
    }

    const matchesNiche = nicheFilter === "all" || site.niche === nicheFilter;

    return matchesSearch && matchesStatus && matchesNiche;
  }) || [];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Meus Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Meus Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Você ainda não cadastrou nenhum projeto.</p>
            <p className="text-sm text-muted-foreground">Clique em "Adicionar Site" para começar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SiteRow = ({ site }: { site: any }) => {
    const { contractStatus, daysRemaining } = useContractStatus({
      isRented: site.is_rented,
      contractEndDate: site.contract_end_date,
    });

    return (
      <tr className="border-b hover:bg-muted/50 transition-colors">
        <td className="p-3">
          <div>
            <div className="font-semibold text-foreground">{site.site_name}</div>
            <a
              href={site.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {new URL(site.site_url).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </td>
        <td className="p-3 text-foreground">
          {site.client_name || <span className="text-muted-foreground italic">-</span>}
        </td>
        <td className="p-3 text-right font-medium text-success">
          R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </td>
        <td className="p-3">
          <ContractStatusBadge status={contractStatus} daysRemaining={daysRemaining} />
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{site.total_pages || 0}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{site.total_page_views?.toLocaleString("pt-BR") || 0}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{site.total_conversions?.toLocaleString("pt-BR") || 0}</span>
          </div>
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{site.conversion_rate || 0}%</span>
          </div>
        </td>
        <td className="p-3 text-foreground">{site.niche}</td>
        <td className="p-3 text-foreground">{site.location}</td>
        <td className="p-3 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/dashboard/site/${site.id}`)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Entrar no Projeto
                </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(site)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar Projeto
              </DropdownMenuItem>
              {!site.is_rented ? (
                <DropdownMenuItem onClick={() => handleRent(site)}>
                  <Play className="w-4 h-4 mr-2" />
                  Alugar Projeto
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => handleRenew(site)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renovar Contrato
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleUnrent(site)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Desalugar Projeto
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meus Projetos ({filteredSites.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="rented">Alugados</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="expiring">Vencendo em 30d</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={nicheFilter} onValueChange={setNicheFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Nichos</SelectItem>
                {uniqueNiches.map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Projeto</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Valor Mensal</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status Contrato</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Páginas</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Page Views</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Conversões</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Taxa</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nicho</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Localização</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <SiteRow key={site.id} site={site} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredSites.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum projeto encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedSite && (
        <>
          <EditSiteWithRentalDialog
            site={selectedSite}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <RentSiteDialog
            open={showRentDialog}
            onOpenChange={setShowRentDialog}
            siteId={selectedSite.id}
            siteName={selectedSite.site_name}
          />
          <RenewContractDialog
            open={showRenewDialog}
            onOpenChange={setShowRenewDialog}
            siteId={selectedSite.id}
            siteName={selectedSite.site_name}
            currentEndDate={selectedSite.contract_end_date}
            currentRent={selectedSite.monthly_rent_value}
          />
          <UnrentSiteDialog
            open={showUnrentDialog}
            onOpenChange={setShowUnrentDialog}
            site={selectedSite}
          />
        </>
      )}
    </>
  );
};
