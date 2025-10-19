import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Link2,
  TrendingUp,
  Phone,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ContractStatusBadge } from "./ContractStatusBadge";
import { ContractStatus } from "@/hooks/useContractStatus";

interface ClientMetric {
  client_id: string;
  client_name: string;
  email?: string;
  phone?: string;
  company?: string;
  niche?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  total_pages_rented?: number;
  total_monthly_value?: number;
  total_page_views?: number;
  total_conversions?: number;
  access_token?: string;
  created_at?: string;
  updated_at?: string;
}

interface ClientsTableProps {
  clients: ClientMetric[];
  onEdit: (client: ClientMetric) => void;
  onDelete: (client: ClientMetric) => void;
  onViewDetails: (client: ClientMetric) => void;
  onViewReport: (token: string) => void;
  onCopyLink: (token: string) => void;
}

export const ClientsTable = ({
  clients,
  onEdit,
  onDelete,
  onViewDetails,
  onViewReport,
  onCopyLink,
}: ClientsTableProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getContractStatus = (endDate?: string): { status: ContractStatus; daysRemaining: number | null } => {
    if (!endDate) return { status: "available", daysRemaining: null };
    
    const end = new Date(endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { status: "expired", daysRemaining };
    } else if (daysRemaining <= 30) {
      return { status: "expiring_soon", daysRemaining };
    } else {
      return { status: "active", daysRemaining };
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Cliente</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Empresa/Nicho</th>
            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Valor Mensal</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status Contrato</th>
            <th className="text-center p-3 text-sm font-medium text-muted-foreground">Páginas</th>
            <th className="text-center p-3 text-sm font-medium text-muted-foreground">Page Views</th>
            <th className="text-center p-3 text-sm font-medium text-muted-foreground">Conversões</th>
            <th className="text-center p-3 text-sm font-medium text-muted-foreground">Taxa</th>
            <th className="text-center p-3 text-sm font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const contractInfo = getContractStatus(client.contract_end_date);
            const conversionRate = client.total_page_views && client.total_page_views > 0
              ? ((client.total_conversions || 0) / client.total_page_views * 100).toFixed(2)
              : "0.00";
            
            return (
              <tr key={client.client_id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(client.client_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{client.client_name}</div>
                      {client.email && (
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-foreground">
                  <div>
                    {client.company && <div className="font-medium">{client.company}</div>}
                    {client.niche && <div className="text-sm text-muted-foreground">{client.niche}</div>}
                    {!client.company && !client.niche && <span className="text-muted-foreground italic">-</span>}
                  </div>
                </td>
                <td className="p-3 text-right font-medium text-success">
                  R$ {Number(client.total_monthly_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3">
                  <ContractStatusBadge 
                    status={contractInfo.status} 
                    daysRemaining={contractInfo.daysRemaining} 
                  />
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{client.total_pages_rented || 0}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{(client.total_page_views || 0).toLocaleString("pt-BR")}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{(client.total_conversions || 0).toLocaleString("pt-BR")}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{conversionRate}%</span>
                  </div>
                </td>
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
                      <DropdownMenuItem onClick={() => onViewDetails(client)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {client.access_token && (
                        <>
                          <DropdownMenuItem onClick={() => onViewReport(client.access_token)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Relatório
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyLink(client.access_token)}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(client)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
