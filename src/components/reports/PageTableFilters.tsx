import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PageTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  totalResults: number;
  filteredResults: number;
}

export const PageTableFilters = ({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  totalResults,
  filteredResults
}: PageTableFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="🔍 Buscar por URL ou título..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</span>
        <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(parseInt(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="999999">Todas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          de {totalResults.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
