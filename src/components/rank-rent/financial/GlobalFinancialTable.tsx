import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SiteFinancialSummary } from "@/hooks/useGlobalFinancialMetrics";
import { EditProjectCostsDialog } from "./EditProjectCostsDialog";

interface GlobalFinancialTableProps {
  sitesMetrics: SiteFinancialSummary[];
}

export const GlobalFinancialTable = ({ sitesMetrics }: GlobalFinancialTableProps) => {
  const [sortBy, setSortBy] = useState<"revenue" | "profit" | "roi" | "margin">("profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editingSiteName, setEditingSiteName] = useState<string>("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sortedMetrics = useMemo(() => {
    return [...sitesMetrics].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "revenue":
          return (a.monthly_revenue - b.monthly_revenue) * multiplier;
        case "profit":
          return (a.monthly_profit - b.monthly_profit) * multiplier;
        case "roi":
          return (a.roi_percentage - b.roi_percentage) * multiplier;
        case "margin":
          return (a.profit_margin - b.profit_margin) * multiplier;
        default:
          return 0;
      }
    });
  }, [sitesMetrics, sortBy, sortOrder]);

  const getStatusBadge = (profit: number, roi: number, conversions: number) => {
    if (conversions === 0) {
      return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Aguardando dados</Badge>;
    }
    if (profit < 0 || roi < 0) {
      return <Badge variant="destructive">Prejuízo</Badge>;
    }
    if (roi < 20) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Baixo ROI</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Lucrativo</Badge>;
  };

  if (sortedMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Nenhum dado financeiro disponível. Configure custos e aluguéis nos seus projetos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Performance Financeira por Projeto</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Lucro</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="roi">ROI</SelectItem>
                <SelectItem value="margin">Margem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Custos</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Páginas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics.map((site) => (
                <TableRow key={site.site_id}>
                  <TableCell className="font-medium max-w-[200px] truncate" title={site.site_name}>
                    {site.site_name}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={site.client_name || "-"}>
                    {site.client_name || "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(site.monthly_revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(site.monthly_costs)}</TableCell>
                  <TableCell className={`text-right font-semibold ${site.monthly_profit > 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(site.monthly_profit)}
                  </TableCell>
                  <TableCell className={`text-right ${site.roi_percentage > 0 ? "text-green-600" : "text-red-600"}`}>
                    {site.roi_percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{site.profit_margin.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{site.total_pages}</TableCell>
                  <TableCell>{getStatusBadge(site.monthly_profit, site.roi_percentage, site.total_conversions)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSiteId(site.site_id);
                        setEditingSiteName(site.site_name);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {sortedMetrics.map((site) => (
            <Card key={site.site_id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" title={site.site_name}>{site.site_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{site.client_name || "Sem cliente"}</p>
                    </div>
                    {getStatusBadge(site.monthly_profit, site.roi_percentage, site.total_conversions)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Receita:</span>
                      <p className="font-medium">{formatCurrency(site.monthly_revenue)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custos:</span>
                      <p className="font-medium">{formatCurrency(site.monthly_costs)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lucro:</span>
                      <p className={`font-semibold ${site.monthly_profit > 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(site.monthly_profit)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ROI:</span>
                      <p className={`font-medium ${site.roi_percentage > 0 ? "text-green-600" : "text-red-600"}`}>
                        {site.roi_percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margem:</span>
                      <p className="font-medium">{site.profit_margin.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Páginas:</span>
                      <p className="font-medium">{site.total_pages}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      setEditingSiteId(site.site_id);
                      setEditingSiteName(site.site_name);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar Custos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      {editingSiteId && (
        <EditProjectCostsDialog
          open={!!editingSiteId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingSiteId(null);
              setEditingSiteName("");
            }
          }}
          siteId={editingSiteId}
          siteName={editingSiteName}
        />
      )}
    </Card>
  );
};
