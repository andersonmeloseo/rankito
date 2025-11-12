import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FileCheck, Search, Download } from "lucide-react";

interface SitemapUrlsListProps {
  urls: string[];
  sitemapName: string;
  onAddToQueue?: (selectedUrls: string[]) => void;
}

export function SitemapUrlsList({ urls, sitemapName, onAddToQueue }: SitemapUrlsListProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "indexed" | "not-indexed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const urlsPerPage = 50;

  // Filter URLs
  const filteredUrls = urls.filter(url => {
    if (searchTerm && !url.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // TODO: Filter by indexation status when we have this data
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUrls.length / urlsPerPage);
  const startIndex = (currentPage - 1) * urlsPerPage;
  const paginatedUrls = filteredUrls.slice(startIndex, startIndex + urlsPerPage);

  // Toggle URL selection
  const toggleUrl = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  // Toggle all visible URLs
  const toggleAllVisible = () => {
    if (selectedUrls.size === paginatedUrls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(paginatedUrls));
    }
  };

  // Download URLs as text file
  const downloadUrls = () => {
    const urlsToDownload = selectedUrls.size > 0 ? Array.from(selectedUrls) : urls;
    const blob = new Blob([urlsToDownload.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sitemapName}-urls.txt`;
    a.click();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="indexed">Já indexadas</SelectItem>
              <SelectItem value="not-indexed">Não indexadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadUrls}>
            <Download className="h-4 w-4 mr-2" />
            {selectedUrls.size > 0 ? `Baixar (${selectedUrls.size})` : 'Baixar Todas'}
          </Button>
          {onAddToQueue && selectedUrls.size > 0 && (
            <Button
              size="sm"
              onClick={() => onAddToQueue(Array.from(selectedUrls))}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Indexar {selectedUrls.size} URL{selectedUrls.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUrls.size === paginatedUrls.length && paginatedUrls.length > 0}
                  onCheckedChange={toggleAllVisible}
                />
              </TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUrls.map((url) => (
              <TableRow key={url}>
                <TableCell>
                  <Checkbox
                    checked={selectedUrls.has(url)}
                    onCheckedChange={() => toggleUrl(url)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{url}</TableCell>
                <TableCell>
                  <Badge variant="outline">Pendente</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {startIndex + 1} a {Math.min(startIndex + urlsPerPage, filteredUrls.length)} de {filteredUrls.length} URLs
          {selectedUrls.size > 0 && ` • ${selectedUrls.size} selecionada${selectedUrls.size > 1 ? 's' : ''}`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
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
    </div>
  );
}
