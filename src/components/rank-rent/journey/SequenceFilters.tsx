import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

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
  onReset
}: SequenceFiltersProps) => {
  const isFiltered = limit !== 10 || minPages !== 1 || minPercentage !== 0;

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
