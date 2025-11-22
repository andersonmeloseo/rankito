import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, MapPin, Target } from "lucide-react";

interface SequenceFiltersProps {
  totalSequences: number;
  filteredCount: number;
  limit: number | 'all';
  minPages: number;
  minPercentage: number;
  onLimitChange: (value: number | 'all') => void;
  onMinPagesChange: (value: number) => void;
  onMinPercentageChange: (value: number) => void;
  onReset: () => void;
  locationFilter?: string;
  onLocationFilterChange?: (value: string) => void;
  conversionFilter?: string;
  onConversionFilterChange?: (value: string) => void;
  uniqueLocations?: string[];
}

export const SequenceFilters = ({
  totalSequences,
  filteredCount,
  limit,
  minPages,
  minPercentage,
  onLimitChange,
  onMinPagesChange,
  onMinPercentageChange,
  onReset,
  locationFilter = 'all',
  onLocationFilterChange,
  conversionFilter = 'all',
  onConversionFilterChange,
  uniqueLocations = []
}: SequenceFiltersProps) => {
  const isFiltered = limit !== 10 || minPages !== 1 || minPercentage !== 0 || locationFilter !== 'all' || conversionFilter !== 'all';

  return (
    <Card className="bg-muted/30 border-border/50">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Filtros de Sequências</h4>
            </div>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Limit Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Mostrar
              </label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onLimitChange(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Pages Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Mínimo de {minPages} {minPages === 1 ? 'página' : 'páginas'}
              </label>
              <div className="pt-2">
                <Slider
                  value={[minPages]}
                  onValueChange={(value) => onMinPagesChange(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Min Percentage Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Mínimo de {minPercentage}% das sessões
              </label>
              <div className="pt-2">
                <Slider
                  value={[minPercentage]}
                  onValueChange={(value) => onMinPercentageChange(value[0])}
                  min={0}
                  max={20}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Location Filter */}
            {onLocationFilterChange && uniqueLocations.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Localização
                </label>
                <Select value={locationFilter} onValueChange={onLocationFilterChange}>
                  <SelectTrigger className="h-9">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Localizações</SelectItem>
                    {uniqueLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conversion Filter */}
            {onConversionFilterChange && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Conversão
                </label>
                <Select value={conversionFilter} onValueChange={onConversionFilterChange}>
                  <SelectTrigger className="h-9">
                    <Target className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Sequências</SelectItem>
                    <SelectItem value="converted">Apenas com Cliques</SelectItem>
                    <SelectItem value="not_converted">Sem Conversão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results Counter */}
          <div className="flex items-center justify-center pt-2">
            <Badge variant="secondary" className="text-xs font-normal">
              📊 Mostrando {filteredCount} de {totalSequences} sequências
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
