import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConversionsTableProps {
  conversions: any[];
  isLoading: boolean;
  siteId: string;
}

export const ConversionsTable = ({ conversions, isLoading, siteId }: ConversionsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil((conversions?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConversions = conversions?.slice(startIndex, endIndex) || [];

  const exportToCSV = () => {
    if (!conversions || conversions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há conversões no período selecionado",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Data", "Hora", "Tipo", "Página", "CTA", "Dispositivo", "IP"];
    const rows = conversions.map(conv => [
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
      description: `${conversions.length} conversões foram exportadas para CSV`,
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
              Mostrando {startIndex + 1}-{Math.min(endIndex, conversions.length)} de {conversions.length} conversões
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
