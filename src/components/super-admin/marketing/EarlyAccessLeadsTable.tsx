import { useState } from "react";
import { useEarlyAccessLeads, useUpdateLeadStatus, EarlyAccessLead } from "@/hooks/useEarlyAccessLeads";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Search, Mail, Phone, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export const EarlyAccessLeadsTable = () => {
  const { data: leads, isLoading } = useEarlyAccessLeads();
  const updateStatus = useUpdateLeadStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", className: "bg-orange-100 text-orange-700" },
      contacted: { label: "Contactado", className: "bg-blue-100 text-blue-700" },
      converted: { label: "Convertido", className: "bg-green-100 text-green-700" },
      rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700" },
    };
    const variant = variants[status as keyof typeof variants] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Espera - Early Access</CardTitle>
        <CardDescription>
          Total de {leads?.length || 0} leads cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="contacted">Contactados</SelectItem>
              <SelectItem value="converted">Convertidos</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Nome</th>
                <th className="text-left p-3 font-semibold">Email</th>
                <th className="text-left p-3 font-semibold">WhatsApp</th>
                <th className="text-left p-3 font-semibold">Nº Sites</th>
                <th className="text-left p-3 font-semibold">Data</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads?.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 font-medium">{lead.full_name}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{lead.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(lead.email);
                          toast({ title: "Email copiado!" });
                        }}
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`, '_blank')}
                    >
                      <Phone className="h-3 w-3" />
                      {lead.whatsapp}
                    </Button>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{lead.num_sites}</Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="p-3">{getStatusBadge(lead.status)}</td>
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => updateStatus.mutate({ id: lead.id, status: 'contacted' })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como Contactado
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus.mutate({ id: lead.id, status: 'converted' })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Marcar como Convertido
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus.mutate({ id: lead.id, status: 'rejected' })}
                        >
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Marcar como Rejeitado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeads?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lead encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};