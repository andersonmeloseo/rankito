import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter, MapPin, Target, Monitor, Clock, Bot } from "lucide-react";
import { JourneyPeriodFilter } from "./JourneyPeriodFilter";
import { DateRange } from "react-day-picker";

interface SessionFiltersProps {
  totalSessions: number;
  filteredCount: number;
  minPages: number;
  minDuration: number;
  onMinPagesChange: (value: number) => void;
  onMinDurationChange: (value: number) => void;
  onReset: () => void;
  locationFilter?: string;
  onLocationFilterChange?: (value: string) => void;
  deviceFilter?: string;
  onDeviceFilterChange?: (value: string) => void;
  conversionFilter?: string;
  onConversionFilterChange?: (value: string) => void;
  botFilter?: 'all' | 'humans' | 'bots';
  onBotFilterChange?: (value: 'all' | 'humans' | 'bots') => void;
  uniqueLocations?: string[];
  periodDays?: number;
  onPeriodChange?: (days: number, startDate?: Date, endDate?: Date) => void;
  customDateRange?: DateRange;
  onCustomDateRangeChange?: (range: DateRange | undefined) => void;
  periodLabel?: string;
}

export const SessionFilters = ({
  totalSessions,
  filteredCount,
  minPages,
  minDuration,
  onMinPagesChange,
  onMinDurationChange,
  onReset,
  locationFilter = 'all',
  onLocationFilterChange,
  deviceFilter = 'all',
  onDeviceFilterChange,
  conversionFilter = 'all',
  onConversionFilterChange,
  botFilter = 'all',
  onBotFilterChange,
  uniqueLocations = [],
  periodDays = 90,
  onPeriodChange,
  customDateRange,
  onCustomDateRangeChange,
  periodLabel,
}: SessionFiltersProps) => {
  const isFiltered = minPages !== 1 || minDuration !== 0 || locationFilter !== 'all' || deviceFilter !== 'all' || conversionFilter !== 'all' || botFilter !== 'all';

  return (
    <Card className="bg-muted/30 border-border/50">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Filtros de Sessões</h4>
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

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period Filter */}
            {onPeriodChange && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  🗓️ Período
                </label>
                <JourneyPeriodFilter
                  periodDays={periodDays}
                  onPeriodChange={onPeriodChange}
                  customDateRange={customDateRange}
                  onCustomDateRangeChange={onCustomDateRangeChange}
                />
              </div>
            )}

            {/* Min Pages Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                📄 Mínimo de Páginas
              </label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[minPages]}
                  onValueChange={(value) => onMinPagesChange(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="cursor-pointer flex-1"
                />
                <Badge variant="outline" className="min-w-[40px] justify-center font-mono">
                  {minPages}
                </Badge>
              </div>
            </div>

            {/* Min Duration Slider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                ⏱️ Duração Mínima
              </label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[minDuration]}
                  onValueChange={(value) => onMinDurationChange(value[0])}
                  min={0}
                  max={300}
                  step={10}
                  className="cursor-pointer flex-1"
                />
                <Badge variant="outline" className="min-w-[50px] justify-center font-mono">
                  {minDuration}s
                </Badge>
              </div>
            </div>

            {/* Device Filter */}
            {onDeviceFilterChange && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Dispositivo
                </label>
                <Select value={deviceFilter} onValueChange={onDeviceFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Conversion Filter */}
            {onConversionFilterChange && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Conversão
                </label>
                <Select value={conversionFilter} onValueChange={onConversionFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="converted">Com Cliques</SelectItem>
                    <SelectItem value="not_converted">Sem Cliques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location Filter */}
            {onLocationFilterChange && uniqueLocations.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Localização
                </label>
                <Select value={locationFilter} onValueChange={onLocationFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Bot Filter */}
            {onBotFilterChange && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  Tipo de Sessão
                </label>
                <Select value={botFilter} onValueChange={onBotFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌐 Todas as Sessões</SelectItem>
                    <SelectItem value="humans">👤 Apenas Humanos</SelectItem>
                    <SelectItem value="bots">🤖 Apenas Bots</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Results Counter */}
          <div className="flex items-center justify-center pt-2">
            <Badge variant="secondary" className="text-xs font-normal">
              📊 Mostrando {filteredCount} de {totalSessions} sessões {periodLabel && `• ${periodLabel}`}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
