import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConversionsTableProps {
  conversions: any[];
  isLoading: boolean;
  siteId: string;
}

export const ConversionsTable = ({ conversions, isLoading, siteId }: ConversionsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const itemsPerPage = 20;

  const filteredConversions = conversions?.filter(conv => {
    const matchesSearch = searchTerm === "" || 
      conv.page_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.cta_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEventType = eventTypeFilter === "all" || conv.event_type === eventTypeFilter;
    
    return matchesSearch && matchesEventType;
  }) || [];

  const totalPages = Math.ceil(filteredConversions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConversions = filteredConversions.slice(startIndex, endIndex);

  const exportToCSV = () => {
    if (!filteredConversions || filteredConversions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há conversões no período selecionado",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Data", "Hora", "Tipo", "Página", "CTA", "Dispositivo", "IP"];
    const rows = filteredConversions.map(conv => [
      new Date(conv.created_at).toLocaleDateString("pt-BR"),
      new Date(conv.created_at).toLocaleTimeString("pt-BR"),
      conv.event_type,
      conv.page_path,
      conv.cta_text || "-",
      conv.metadata?.device || "-",
      conv.ip_address || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conversoes-${siteId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "✅ Exportado com sucesso!",
      description: `${filteredConversions.length} conversões foram exportadas para CSV`,
    });
  };

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case "page_view":
        return "outline";
      case "phone_click":
        return "default";
      case "email_click":
        return "secondary";
      case "whatsapp_click":
        return "default";
      case "form_submit":
        return "default";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Conversões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!conversions || conversions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Conversões Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Nenhuma conversão registrada no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Conversões Detalhadas</CardTitle>
            <CardDescription>
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredConversions.length)} de {filteredConversions.length} conversões
              {searchTerm || eventTypeFilter !== "all" ? ` (filtrado de ${conversions?.length || 0} total)` : ""}
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por página ou CTA..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={eventTypeFilter} onValueChange={(value) => {
            setEventTypeFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="whatsapp_click">WhatsApp</SelectItem>
              <SelectItem value="phone_click">Telefone</SelectItem>
              <SelectItem value="email_click">Email</SelectItem>
              <SelectItem value="form_submit">Formulário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>CTA</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentConversions.map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">
                      {new Date(conv.created_at).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conv.created_at).toLocaleTimeString("pt-BR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEventBadgeVariant(conv.event_type)}>
                      {conv.event_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={conv.page_path}>
                      {conv.page_path}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={conv.cta_text || "-"}>
                      {conv.cta_text || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {conv.metadata?.device || "desktop"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {conv.ip_address || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
