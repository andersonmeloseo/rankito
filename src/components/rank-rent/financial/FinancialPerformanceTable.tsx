import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialMetric } from "@/hooks/useFinancialMetrics";

interface FinancialPerformanceTableProps {
  metrics: FinancialMetric[];
}

type SortField = "page_title" | "monthly_revenue" | "total_conversions" | "monthly_profit" | "roi_percentage" | "profit_margin";
type SortOrder = "asc" | "desc";

export const FinancialPerformanceTable = ({ metrics }: FinancialPerformanceTableProps) => {
  const [sortField, setSortField] = useState<SortField>("monthly_profit");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aValue = Number(a[sortField]) || 0;
    const bValue = Number(b[sortField]) || 0;
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const getStatusBadge = (profit: number, roi: number) => {
    if (profit > 0 && roi > 50) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Excelente</Badge>;
    } else if (profit > 0 && roi > 0) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Lucrativa</Badge>;
    } else if (profit === 0) {
      return <Badge variant="outline">Break-even</Badge>;
    } else {
      return <Badge variant="destructive">Prejuízo</Badge>;
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 50) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value > 0) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    if (value === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Financeira por Página</CardTitle>
          <CardDescription>
            Nenhuma página alugada encontrada. Configure custos e alugue páginas para ver análises financeiras.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Financeira por Página</CardTitle>
        <CardDescription>
          Análise detalhada de receita, custos e lucratividade de cada página
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("page_title")} className="h-8 p-0 hover:bg-transparent">
                    Página <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("monthly_revenue")} className="h-8 p-0 hover:bg-transparent">
                    Receita <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("total_conversions")} className="h-8 p-0 hover:bg-transparent">
                    Conversões <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Custos</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("monthly_profit")} className="h-8 p-0 hover:bg-transparent">
                    Lucro <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("roi_percentage")} className="h-8 p-0 hover:bg-transparent">
                    ROI <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort("profit_margin")} className="h-8 p-0 hover:bg-transparent">
                    Margem <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics.map((metric) => {
                const totalCosts = Number(metric.monthly_conversion_costs) + Number(metric.monthly_fixed_costs);
                const profit = Number(metric.monthly_profit);
                const roi = Number(metric.roi_percentage);
                const margin = Number(metric.profit_margin);

                return (
                  <TableRow key={metric.page_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{metric.page_title || "Sem título"}</span>
                        <span className="text-xs text-muted-foreground">{metric.page_path}</span>
                      </div>
                    </TableCell>
                    <TableCell>{metric.client_name || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {Number(metric.monthly_revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(metric.total_conversions).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right text-orange-500">
                      R$ {totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(roi)}
                        <span className={roi >= 0 ? "text-green-500" : "text-red-500"}>
                          {roi.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {margin.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(profit, roi)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
