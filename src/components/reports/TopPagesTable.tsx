import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageTableFilters } from "./PageTableFilters";
import { ReportStyle } from "./ReportStyleConfigurator";

interface TopPage {
  page: string;
  conversions: number;
  pageViews: number;
  conversionRate: number;
}

interface TopPagesTableProps {
  pages: TopPage[];
  style: ReportStyle;
}

export const TopPagesTable = ({ pages, style }: TopPagesTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar páginas
  const filteredPages = useMemo(() => {
    if (!searchTerm) return pages;
    const term = searchTerm.toLowerCase();
    return pages.filter(page => 
      page.page.toLowerCase().includes(term)
    );
  }, [pages, searchTerm]);

  // Paginar
  const paginatedPages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPages.slice(startIndex, startIndex + pageSize);
  }, [filteredPages, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPages.length / pageSize);

  // Reset para página 1 quando filtrar
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            📊 Top Páginas
          </h3>
          <p className="text-sm text-muted-foreground">
            {filteredPages.length === pages.length 
              ? `Exibindo ${filteredPages.length.toLocaleString()} páginas` 
              : `${filteredPages.length.toLocaleString()} de ${pages.length.toLocaleString()} páginas`
            }
          </p>
        </div>
      </div>

      <PageTableFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        totalResults={pages.length}
        filteredResults={filteredPages.length}
      />

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Página</TableHead>
                <TableHead className="text-right">Conversões</TableHead>
                <TableHead className="text-right">Page Views</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    🔍 Nenhuma página encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPages.map((page, i) => {
                  const globalIndex = (currentPage - 1) * pageSize + i;
                  return (
                    <TableRow key={i} className={globalIndex < 3 ? 'bg-primary/5' : ''}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {globalIndex + 1}
                        {globalIndex === 0 && ' 🥇'}
                        {globalIndex === 1 && ' 🥈'}
                        {globalIndex === 2 && ' 🥉'}
                      </TableCell>
                      <TableCell className="font-medium max-w-[400px] truncate">
                        {page.page}
                      </TableCell>
                      <TableCell className="text-right font-semibold" style={{ color: style.customColors.primary }}>
                        {page.conversions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {page.pageViews.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {page.conversionRate.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
