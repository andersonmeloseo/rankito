import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  FolderOpen,
  Pencil,
  MoreVertical,
  Play,
  RefreshCw,
  Eye,
  Phone,
  FileText,
  TrendingUp,
  XCircle,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { useContractStatus } from "@/hooks/useContractStatus";
import { format, subDays } from "date-fns";

interface SitesGridProps {
  sites: any[];
  selectedSites: Set<string>;
  onSelectSite: (siteId: string) => void;
  onEdit: (site: any) => void;
  onRent: (site: any) => void;
  onRenew: (site: any) => void;
  onUnrent: (site: any) => void;
  onDelete: (site: any) => void;
}

export const SitesGrid = ({
  sites,
  selectedSites,
  onSelectSite,
  onEdit,
  onRent,
  onRenew,
  onUnrent,
  onDelete,
}: SitesGridProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Prefetch site data on hover for instant navigation
  const handlePrefetch = (siteId: string) => {
    const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");

    // Prefetch site details
    queryClient.prefetchQuery({
      queryKey: ["site-details", siteId],
      queryFn: async () => {
        const { data: siteData } = await supabase
          .from("rank_rent_sites")
          .select("is_ecommerce, site_name, site_url, niche, location, tracking_token")
          .eq("id", siteId)
          .single();
        const { data: metricsData } = await supabase
          .from("rank_rent_metrics")
          .select("*")
          .eq("site_id", siteId)
          .single();
        return { ...metricsData, is_ecommerce: siteData?.is_ecommerce };
      },
      staleTime: 120000,
    });

    // Prefetch pages list
    queryClient.prefetchQuery({
      queryKey: ["site-pages", siteId, 10, "total_page_views", false, "", "all", "all"],
      queryFn: async () => {
        const { data, count } = await supabase
          .from("rank_rent_page_metrics")
          .select("*", { count: 'exact' })
          .eq("site_id", siteId)
          .order("total_page_views", { ascending: false })
          .range(0, 9);
        return { pages: data || [], total: count || 0 };
      },
      staleTime: 120000,
    });
  };

  const SiteCard = ({ site }: { site: any }) => {
    const { contractStatus, daysRemaining } = useContractStatus({
      isRented: site.is_rented,
      contractEndDate: site.contract_end_date,
    });

    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50"
        onMouseEnter={() => handlePrefetch(site.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Checkbox
                checked={selectedSites.has(site.id)}
                onCheckedChange={() => onSelectSite(site.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate(`/dashboard/site/${site.id}`)}
                  className="font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer block truncate"
                >
                  {site.site_name}
                </button>
                <a
                  href={site.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  {new URL(site.site_url).hostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <DropdownMenuItem onClick={() => onEdit(site)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Projeto
                </DropdownMenuItem>
                {!site.is_rented ? (
                  <DropdownMenuItem onClick={() => onRent(site)}>
                    <Play className="w-4 h-4 mr-2" />
                    Alugar Projeto
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onRenew(site)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renovar Contrato
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onUnrent(site)}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Desalugar Projeto
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(site)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Projeto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cliente</span>
            <span className="text-sm font-medium">
              {site.client_name || <span className="text-muted-foreground italic">-</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Valor Mensal</span>
            <span className="text-sm font-semibold text-success">
              R$ {Number(site.monthly_rent_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <ContractStatusBadge status={contractStatus} daysRemaining={daysRemaining} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs">Páginas</span>
              </div>
              <span className="text-sm font-medium">{site.total_pages || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                <span className="text-xs">Views</span>
              </div>
              <span className="text-sm font-medium">{site.total_page_views?.toLocaleString("pt-BR") || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span className="text-xs">Conversões</span>
              </div>
              <span className="text-sm font-medium">{site.total_conversions?.toLocaleString("pt-BR") || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs">Taxa</span>
              </div>
              <span className="text-sm font-medium">{site.conversion_rate || 0}%</span>
            </div>
          </div>

          {(site.niche || site.is_ecommerce) && (
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {site.is_ecommerce && (
                <Badge variant="default" className="text-xs bg-orange-600 hover:bg-orange-700">
                  🛒 E-commerce
                </Badge>
              )}
              {site.niche && (
                <Badge variant="secondary" className="text-xs">
                  {site.niche}
                </Badge>
              )}
              {site.location && (
                <Badge variant="outline" className="text-xs">
                  {site.location}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (sites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum projeto encontrado com os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} />
      ))}
    </div>
  );
};
