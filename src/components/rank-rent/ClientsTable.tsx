import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  ExternalLink,
  Copy,
  ArrowUpDown,
  Mail,
  Phone,
  Building,
  Eye,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";

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

type SortField = "name" | "revenue" | "pages" | "contract_end";
type SortOrder = "asc" | "desc";

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
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getContractStatus = (endDate: string) => {
    if (!endDate) return null;
    
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilEnd < 0) {
      return { 
        label: "Vencido", 
        variant: "destructive" as const, 
        days: Math.abs(daysUntilEnd),
        prefix: "há"
      };
    } else if (daysUntilEnd <= 30) {
      return { 
        label: "Vencendo", 
        variant: "secondary" as const, 
        days: daysUntilEnd,
        prefix: "em"
      };
    } else {
      return { 
        label: "Ativo", 
        variant: "default" as const, 
        days: daysUntilEnd,
        prefix: "em"
      };
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortField) {
      case "name":
        compareValue = a.client_name.localeCompare(b.client_name);
        break;
      case "revenue":
        compareValue = Number(a.total_monthly_value) - Number(b.total_monthly_value);
        break;
      case "pages":
        compareValue = Number(a.total_pages_rented) - Number(b.total_pages_rented);
        break;
      case "contract_end":
        if (!a.contract_end_date) return 1;
        if (!b.contract_end_date) return -1;
        compareValue = new Date(a.contract_end_date).getTime() - new Date(b.contract_end_date).getTime();
        break;
    }
    
    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  // Mobile Card View
  const MobileCard = ({ client }: { client: ClientMetric }) => {
    const contractStatus = getContractStatus(client.contract_end_date);
    
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(client.client_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{client.client_name}</h4>
                {client.company && (
                  <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails(client)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {client.access_token && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewReport(client.access_token)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Relatório
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onCopyLink(client.access_token)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Link
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {client.niche && (
                <Badge variant="outline" className="text-xs">
                  {client.niche}
                </Badge>
              )}
              {contractStatus && (
                <Badge variant={contractStatus.variant} className="text-xs">
                  {contractStatus.label} {contractStatus.prefix} {contractStatus.days}d
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{client.total_pages_rented}</span>
                <span className="text-muted-foreground">páginas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-success" />
                <span className="font-medium text-success">
                  R$ {Number(client.total_monthly_value || 0).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{client.total_page_views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{client.total_conversions || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <SortButton field="name">Cliente</SortButton>
              </TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead className="text-right">
                <SortButton field="pages">Páginas</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="revenue">Receita/Mês</SortButton>
              </TableHead>
              <TableHead className="text-center">
                <SortButton field="contract_end">Status</SortButton>
              </TableHead>
              <TableHead className="text-right w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.map((client) => {
              const contractStatus = getContractStatus(client.contract_end_date);
              
              return (
                <TableRow key={client.client_id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                          {getInitials(client.client_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{client.client_name}</p>
                        {client.company && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {client.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.niche && (
                      <Badge variant="outline" className="text-xs">
                        {client.niche}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {client.total_pages_rented || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium text-success">
                    R$ {Number(client.total_monthly_value || 0).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-center">
                    {contractStatus && (
                      <div className="inline-flex flex-col items-center">
                        <Badge variant={contractStatus.variant} className="text-xs">
                          {contractStatus.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {contractStatus.prefix} {contractStatus.days}d
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(client)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {client.access_token && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onViewReport(client.access_token)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver Relatório
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopyLink(client.access_token)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Link
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(client)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {sortedClients.map((client) => (
          <MobileCard key={client.client_id} client={client} />
        ))}
      </div>
    </>
  );
};
