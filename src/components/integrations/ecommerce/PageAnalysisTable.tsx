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
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

export interface PageAnalysis {
  pagePath: string;
  pageUrl: string;
  revenue: number;
  purchases: number;
  views: number;
  conversionRate: number;
  topProducts: Array<{
    productName: string;
    purchases: number;
    revenue: number;
  }>;
}

interface PageAnalysisTableProps {
  pages: PageAnalysis[];
  siteId: string;
}

type SortField = "pagePath" | "revenue" | "purchases" | "views" | "conversionRate";
type SortDirection = "asc" | "desc" | null;

export const PageAnalysisTable = ({ pages, siteId }: PageAnalysisTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortField("revenue");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRowExpansion = (pagePath: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(pagePath)) {
      newExpanded.delete(pagePath);
    } else {
      newExpanded.add(pagePath);
    }
    setExpandedRows(newExpanded);
  };

  const filteredPages = useMemo(() => {
    return pages.filter(page =>
      page.pagePath.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  const sortedPages = useMemo(() => {
    if (!sortDirection) return filteredPages;

    return [...filteredPages].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === "asc" 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredPages, sortField, sortDirection]);

  const paginatedPages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedPages.slice(startIndex, startIndex + pageSize);
  }, [sortedPages, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedPages.length / pageSize);

  const handleExport = (format: "excel" | "csv") => {
    const exportData = sortedPages.map(page => ({
      "Página": page.pagePath,
      "URL Completa": page.pageUrl,
      "Receita (R$)": page.revenue.toFixed(2),
      "Vendas": page.purchases,
      "Visualizações": page.views,
      "Taxa de Conversão (%)": page.conversionRate.toFixed(2),
      "Top 3 Produtos": page.topProducts.slice(0, 3).map(p => p.productName).join(", ")
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Análise por Página");

    const fileName = `analise-paginas-${siteId}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === "excel") {
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      XLSX.writeFile(wb, `${fileName}.csv`);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === "desc") return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>Análise por Página</CardTitle>
            <Select onValueChange={handleExport}>
              <SelectTrigger className="w-[180px]">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por URL da página..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="25">25 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("pagePath")}
                >
                  <div className="flex items-center gap-2">
                    Página
                    {getSortIcon("pagePath")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("revenue")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Receita
                    {getSortIcon("revenue")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("purchases")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Vendas
                    {getSortIcon("purchases")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("views")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Visualizações
                    {getSortIcon("views")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 text-right"
                  onClick={() => handleSort("conversionRate")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Taxa de Conversão
                    {getSortIcon("conversionRate")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma página encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPages.map((page) => (
                  <>
                    <TableRow key={page.pagePath} className="hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(page.pagePath)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedRows.has(page.pagePath) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[300px]">{page.pagePath}</span>
                          <a
                            href={page.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {page.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{page.purchases}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {page.views}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={page.conversionRate >= 3 ? "default" : "secondary"}>
                          {page.conversionRate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(page.pagePath) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="py-4 px-6">
                            <h4 className="font-semibold mb-3 text-sm">
                              Produtos Mais Vendidos Nesta Página
                            </h4>
                            {page.topProducts.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Nenhum produto vendido nesta página
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {page.topProducts.slice(0, 5).map((product, idx) => (
                                  <div
                                    key={`${page.pagePath}-${product.productName}`}
                                    className="flex items-center justify-between bg-background rounded-md p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline" className="font-mono">
                                        #{idx + 1}
                                      </Badge>
                                      <span className="font-medium text-sm">
                                        {product.productName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                      <div className="text-sm text-muted-foreground">
                                        {product.purchases} vendas
                                      </div>
                                      <div className="text-sm font-semibold text-green-600">
                                        R$ {product.revenue.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * pageSize) + 1} a{" "}
              {Math.min(currentPage * pageSize, sortedPages.length)} de{" "}
              {sortedPages.length} páginas
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
