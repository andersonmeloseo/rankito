import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building,
  BarChart,
  ExternalLink,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  FileText,
  Globe,
} from "lucide-react";
import { ClientWithPortalStatus } from "@/hooks/useClientIntegration";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientCardProps {
  client: ClientWithPortalStatus;
  onEdit: () => void;
  onDelete: () => void;
  onOpenPortal: () => void;
  onManageAccess: () => void;
  onViewDetails: () => void;
  onCopyLink: () => void;
  onViewReport: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const ClientCard = ({
  client,
  onEdit,
  onDelete,
  onOpenPortal,
  onManageAccess,
  onViewDetails,
  onCopyLink,
  onViewReport,
}: ClientCardProps) => {
  const conversionRate =
    client.page_views_30d > 0
      ? ((client.conversions_30d / client.page_views_30d) * 100).toFixed(2)
      : "0.00";

  // Fetch client sites
  const { data: clientSites, isLoading: sitesLoading } = useQuery({
    queryKey: ["client-sites-card", client.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_sites")
        .select("id, site_name, site_url, monthly_rent_value")
        .eq("client_id", client.client_id)
        .eq("is_rented", true)
        .order("site_name");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(client.client_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{client.client_name}</h3>
              <p className="text-sm text-muted-foreground">{client.email}</p>
              {client.phone && (
                <p className="text-xs text-muted-foreground">{client.phone}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewReport}>
                <FileText className="w-4 h-4 mr-2" />
                Ver Relatório
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link Portal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Empresa e Nicho */}
        {(client.company || client.niche) && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span>
              {client.niche}
              {client.company && ` · ${client.company}`}
            </span>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
            <BarChart className="w-4 h-4" />
            Analytics (30 dias)
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold">{client.page_views_30d}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div>
              <p className="text-lg font-bold">{client.conversions_30d}</p>
              <p className="text-xs text-muted-foreground">Conversões</p>
            </div>
            <div>
              <p className="text-lg font-bold">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa</p>
            </div>
          </div>
        </div>

        {/* Sites Alugados */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Sites Alugados ({client.total_sites})
          </h4>
          {sitesLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : clientSites && clientSites.length > 0 ? (
            <div className="space-y-2">
              {clientSites.map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <span className="text-sm font-medium truncate flex-1">{site.site_name}</span>
                  <Badge variant="secondary" className="ml-2">
                    R$ {site.monthly_rent_value?.toLocaleString("pt-BR") || "0"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum site alugado</p>
          )}
        </div>

        {/* Financial Info */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-primary">
            R$ {client.total_monthly_value.toLocaleString("pt-BR")}
          </span>
          <div className="text-sm text-muted-foreground text-right">
            <p>{client.total_pages} páginas</p>
            <p>{client.total_sites} sites</p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={client.portal_enabled ? "default" : "secondary"}>
            {client.portal_enabled ? "✅ Portal Ativo" : "⚪ Portal Inativo"}
          </Badge>
          <Badge variant={client.end_client_active ? "default" : "secondary"}>
            {client.end_client_active ? "✅ Acesso Ativo" : "⚪ Sem Acesso"}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onOpenPortal}
          disabled={!client.portal_enabled}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver Portal
        </Button>
        <Button variant="outline" className="flex-1" onClick={onManageAccess}>
          <Users className="w-4 h-4 mr-2" />
          Gerenciar
        </Button>
      </CardFooter>
    </Card>
  );
};
