import { FinancialMetric } from "@/hooks/useFinancialMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SimpleFinancialTableProps {
  metrics: FinancialMetric[];
}

export const SimpleFinancialTable = ({ metrics }: SimpleFinancialTableProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (profit: number, roi: number) => {
    if (profit < 0) {
      return <Badge variant="destructive">❌ Prejuízo</Badge>;
    }
    if (roi < 50) {
      return <Badge variant="secondary">⚠️ Margem Baixa</Badge>;
    }
    return <Badge variant="default">✅ Lucrando</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento por Página</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Página</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Custos</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => {
              const revenue = Number(metric.monthly_revenue) || 0;
              const costs = Number(metric.proportional_fixed_cost) || 0;
              const profit = Number(metric.monthly_profit) || 0;
              const roi = Number(metric.roi_percentage) || 0;

              return (
                <TableRow key={metric.page_id}>
                  <TableCell className="font-medium">
                    {metric.page_title || metric.page_path}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(costs)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(profit)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(profit, roi)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
