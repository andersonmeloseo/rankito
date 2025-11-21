import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PerformanceBadge } from "./PerformanceBadge";
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as XLSX from "xlsx";

interface Product {
  productId: string;
  productName: string;
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  productUrl?: string;
  performanceType?: "top" | "featured" | "warning" | "growth" | "recovery";
}

interface ProductsFullTableProps {
  products: Product[];
  siteId: string;
}

type SortField = "productName" | "purchases" | "revenue" | "views" | "conversionRate";
type SortOrder = "asc" | "desc";

export const ProductsFullTable = ({ products, siteId }: ProductsFullTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "productName") {
        return sortOrder === "asc"
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string);
      }

      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [products, searchTerm, sortField, sortOrder]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize);

  const handleExportExcel = () => {
    const exportData = filteredAndSortedProducts.map((product) => ({
      Produto: product.productName,
      Vendas: product.purchases,
      "Receita (R$)": product.revenue,
      Visualizações: product.views,
      "No Carrinho": product.addToCarts,
      "Taxa de Conversão (%)": product.conversionRate,
      "URL do Produto": product.productUrl || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

    const colWidths = [
      { wch: 40 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 50 },
    ];
    worksheet["!cols"] = colWidths;

    const fileName = `produtos_ecommerce_${siteId}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportCSV = () => {
    const exportData = filteredAndSortedProducts.map((product) => ({
      Produto: product.productName,
      Vendas: product.purchases,
      "Receita (R$)": product.revenue,
      Visualizações: product.views,
      "No Carrinho": product.addToCarts,
      "Taxa de Conversão (%)": product.conversionRate,
      "URL do Produto": product.productUrl || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `produtos_ecommerce_${siteId}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Todos os Produtos ({filteredAndSortedProducts.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="25">25 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => {
              if (value === "excel") handleExportExcel();
              if (value === "csv") handleExportCSV();
            }}>
              <SelectTrigger className="w-[140px]">
                <Download className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Exportar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("productName")}
                  className="flex items-center p-0 hover:bg-transparent"
                >
                  Produto
                  <SortIcon field="productName" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("purchases")}
                  className="flex items-center justify-end w-full p-0 hover:bg-transparent"
                >
                  Vendas
                  <SortIcon field="purchases" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("revenue")}
                  className="flex items-center justify-end w-full p-0 hover:bg-transparent"
                >
                  Receita
                  <SortIcon field="revenue" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("views")}
                  className="flex items-center justify-end w-full p-0 hover:bg-transparent"
                >
                  Visualizações
                  <SortIcon field="views" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("conversionRate")}
                  className="flex items-center justify-end w-full p-0 hover:bg-transparent"
                >
                  Taxa Conv.
                  <SortIcon field="conversionRate" />
                </Button>
              </TableHead>
              <TableHead>URL do Produto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.productName}</span>
                      {product.performanceType && (
                        <PerformanceBadge type={product.performanceType} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.purchases}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.revenue)}
                  </TableCell>
                  <TableCell className="text-right">{product.views}</TableCell>
                  <TableCell className="text-right">{product.conversionRate.toFixed(2)}%</TableCell>
                  <TableCell>
                    {product.productUrl ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={product.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline max-w-[300px] truncate"
                            >
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {product.productUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </span>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[400px] break-all">{product.productUrl}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * pageSize) + 1} a{" "}
              {Math.min(currentPage * pageSize, filteredAndSortedProducts.length)} de{" "}
              {filteredAndSortedProducts.length} produtos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
