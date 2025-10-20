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
} from "lucide-react";
import { ClientWithPortalStatus } from "@/hooks/useClientIntegration";

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

      <CardContent className="space-y-4">
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
        <div className="bg-muted/50 rounded-lg p-3">
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

        {/* Financial Info */}
        <div className="flex items-center justify-between">
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
