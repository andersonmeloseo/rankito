import { useState } from "react";
import { FinancialMetric } from "@/hooks/useFinancialMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EditPageDialog } from "@/components/rank-rent/EditPageDialog";

interface SimpleFinancialTableProps {
  metrics: FinancialMetric[];
}

export const SimpleFinancialTable = ({ metrics }: SimpleFinancialTableProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEdit = (metric: FinancialMetric) => {
    setSelectedPage({
      page_id: metric.page_id,
      page_title: metric.page_title,
      page_url: metric.page_url,
      page_path: metric.page_path,
      client_id: metric.client_id,
      phone_number: metric.phone_number,
      monthly_rent_value: metric.monthly_rent_value,
      is_rented: metric.is_rented,
      status: metric.status,
    });
    setShowEditDialog(true);
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
              <TableHead className="text-center">Ações</TableHead>
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
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(metric)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {selectedPage && (
        <EditPageDialog
          page={selectedPage}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
    </Card>
  );
};
