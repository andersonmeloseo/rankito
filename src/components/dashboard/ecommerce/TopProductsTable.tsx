import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp } from "lucide-react";

interface TopProductsTableProps {
  userId: string;
}

export const TopProductsTable = ({ userId }: TopProductsTableProps) => {
  // Mock data - seria buscado do backend agregando metadata de todos os sites
  const topProducts = [
    { 
      name: "Notebook Dell Inspiron 15", 
      sales: 45, 
      revenue: 67500, 
      views: 890,
      conversionRate: 5.06,
      avgPrice: 1500 
    },
    { 
      name: "iPhone 14 Pro Max 256GB", 
      sales: 38, 
      revenue: 228000, 
      views: 1240,
      conversionRate: 3.06,
      avgPrice: 6000 
    },
    { 
      name: "Samsung Galaxy S23 Ultra", 
      sales: 32, 
      revenue: 160000, 
      views: 980,
      conversionRate: 3.27,
      avgPrice: 5000 
    },
    { 
      name: "MacBook Air M2", 
      sales: 28, 
      revenue: 280000, 
      views: 650,
      conversionRate: 4.31,
      avgPrice: 10000 
    },
    { 
      name: "Smart TV LG 55\" OLED", 
      sales: 25, 
      revenue: 100000, 
      views: 1100,
      conversionRate: 2.27,
      avgPrice: 4000 
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top 5 Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Visualizações</TableHead>
              <TableHead className="text-right">Conv. Rate</TableHead>
              <TableHead className="text-right">Preço Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.map((product, index) => (
              <TableRow key={product.name}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      #{index + 1}
                    </Badge>
                    {product.name}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-semibold">{product.sales}</span>
                    <span className="text-xs text-muted-foreground">un.</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(product.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  {product.views.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="secondary"
                    className={product.conversionRate > 4 ? "bg-green-100 text-green-700" : ""}
                  >
                    {product.conversionRate.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(product.avgPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total de produtos únicos vendidos: <strong>247</strong></span>
            </div>
            <div className="text-muted-foreground">
              Receita total dos top 5: <strong className="text-foreground">{formatCurrency(835500)}</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
