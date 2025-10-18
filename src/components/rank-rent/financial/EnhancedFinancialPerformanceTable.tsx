import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react";
import { FinancialMetric } from "@/hooks/useFinancialMetrics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface EnhancedFinancialPerformanceTableProps {
  metrics: FinancialMetric[];
}

export const EnhancedFinancialPerformanceTable = ({ metrics }: EnhancedFinancialPerformanceTableProps) => {
  const [sortField, setSortField] = useState<keyof FinancialMetric>("monthly_profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sortedMetrics = [...metrics].sort((a, b) => {
    const aVal = Number(a[sortField]);
    const bVal = Number(b[sortField]);
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: keyof FinancialMetric) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const startEditing = (pageId: string, currentValue: number) => {
    setEditingPageId(pageId);
    setEditValue(currentValue.toString());
  };

  const cancelEditing = () => {
    setEditingPageId(null);
    setEditValue("");
  };

  const saveEdit = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from("rank_rent_pages")
        .update({ monthly_rent_value: Number(editValue) })
        .eq("id", pageId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["financial-metrics"] });
      toast({
        title: "Valor atualizado",
        description: "O valor foi atualizado e as métricas recalculadas.",
      });
      cancelEditing();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (profit: number, roi: number) => {
    if (profit < 0 || roi < 0) {
      return <Badge variant="destructive">Prejuízo</Badge>;
    }
    if (roi > 1000) {
      return <Badge className="bg-green-600">Excelente</Badge>;
    }
    if (roi > 500) {
      return <Badge className="bg-blue-600">Bom</Badge>;
    }
    return <Badge variant="secondary">Regular</Badge>;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Financeira por Página</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Página</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("monthly_revenue")}>
                    Receita <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Conversões</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("monthly_profit")}>
                    Lucro <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort("roi_percentage")}>
                    ROI <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics.map((metric) => (
                <TableRow key={metric.page_id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="text-sm">{metric.page_title || "Sem título"}</p>
                      <p className="text-xs text-muted-foreground">{metric.page_path}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingPageId === metric.page_id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24"
                          step="0.01"
                        />
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(metric.page_id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {formatCurrency(Number(metric.monthly_revenue))}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => startEditing(metric.page_id, Number(metric.monthly_revenue))}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{metric.total_conversions}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(metric.conversion_rate).toFixed(2)}% taxa
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(Number(metric.monthly_profit))}
                      <span className={Number(metric.monthly_profit) < 0 ? "text-red-600" : ""}>
                        {formatCurrency(Number(metric.monthly_profit))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(Number(metric.roi_percentage))}
                      <span>{Number(metric.roi_percentage).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{Number(metric.profit_margin).toFixed(1)}%</TableCell>
                  <TableCell>
                    {getStatusBadge(Number(metric.monthly_profit), Number(metric.roi_percentage))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
};
