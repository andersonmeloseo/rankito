import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GSCPageTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  statusFilter: string[];
  onStatusFilterChange: (statuses: string[]) => void;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  integrationFilter: string | null;
  onIntegrationFilterChange: (integrationId: string | null) => void;
  totalResults: number;
  filteredResults: number;
  integrations?: Array<{ id: string; connection_name: string; google_email: string }>;
}

const STATUS_OPTIONS = [
  { value: "completed", label: "✅ Indexado" },
  { value: "pending", label: "⏳ Pendente" },
  { value: "failed", label: "❌ Falha" },
  { value: "not_submitted", label: "⚪ Não Submetido" },
];

const DATE_OPTIONS = [
  { value: "all", label: "Todas as datas" },
  { value: "24h", label: "Últimas 24 horas" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "never", label: "Nunca submetido" },
];

export function GSCPageTableFilters({
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  integrationFilter,
  onIntegrationFilterChange,
  totalResults,
  filteredResults,
  integrations = [],
}: GSCPageTableFiltersProps) {
  const hasActiveFilters = statusFilter.length > 0 || dateFilter !== "all" || integrationFilter !== null;

  const handleClearFilters = () => {
    onStatusFilterChange([]);
    onDateFilterChange("all");
    onIntegrationFilterChange(null);
    onSearchChange("");
  };

  const toggleStatus = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: Busca e Filtros principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por URL ou título..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtro por Status (multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {statusFilter.length === 0 ? (
                "Status: Todos"
              ) : (
                <span className="flex items-center gap-2">
                  Status
                  <Badge variant="secondary" className="ml-1">
                    {statusFilter.length}
                  </Badge>
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-4">
            <div className="space-y-3">
              <div className="font-medium text-sm">Filtrar por Status GSC</div>
              {STATUS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={statusFilter.includes(option.value)}
                    onCheckedChange={() => toggleStatus(option.value)}
                  />
                  <label
                    htmlFor={`status-${option.value}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filtro por Data */}
        <Select value={dateFilter} onValueChange={onDateFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Data de Submissão" />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Integração GSC */}
        <Select
          value={integrationFilter || "all"}
          onValueChange={(value) => onIntegrationFilterChange(value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Integração GSC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as integrações</SelectItem>
            {integrations.map((integration) => (
              <SelectItem key={integration.id} value={integration.id}>
                {integration.connection_name} ({integration.google_email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Linha 2: Itens por página, badges de filtros ativos e resultados */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="999999">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Badges de filtros ativos */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {statusFilter.length > 0 && (
                <Badge variant="secondary">
                  {statusFilter.length} status
                </Badge>
              )}
              {dateFilter !== "all" && (
                <Badge variant="secondary">
                  Data: {DATE_OPTIONS.find(o => o.value === dateFilter)?.label}
                </Badge>
              )}
              {integrationFilter && (
                <Badge variant="secondary">
                  Integração: {integrations.find(i => i.id === integrationFilter)?.connection_name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Mostrando {filteredResults} de {totalResults} resultados
        </div>
      </div>
    </div>
  );
}
