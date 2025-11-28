import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface PeriodPreset {
  label: string;
  days: number | 'custom';
}

const PERIOD_PRESETS: PeriodPreset[] = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 }, // 3 meses - PADRÃO
  { label: "Últimos 6 meses", days: 180 },
  { label: "Período customizado", days: 'custom' },
];

interface JourneyPeriodFilterProps {
  periodDays: number;
  onPeriodChange: (days: number, startDate?: Date, endDate?: Date) => void;
  customDateRange?: DateRange;
  onCustomDateRangeChange?: (range: DateRange | undefined) => void;
}

export const JourneyPeriodFilter = ({
  periodDays,
  onPeriodChange,
  customDateRange,
  onCustomDateRangeChange,
}: JourneyPeriodFilterProps) => {
  const isCustomPeriod = ![7, 30, 90, 180].includes(periodDays);

  const handlePresetChange = (value: string) => {
    const preset = PERIOD_PRESETS.find(p => p.days.toString() === value);
    if (!preset) return;

    if (preset.days === 'custom') {
      // Não fazer nada, usuário precisa selecionar datas
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - preset.days);
    onPeriodChange(preset.days, startDate, endDate);
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    if (onCustomDateRangeChange) {
      onCustomDateRangeChange(range);
    }
    if (range?.from && range?.to) {
      const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
      onPeriodChange(days, range.from, range.to);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={isCustomPeriod ? 'custom' : periodDays.toString()}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="Selecione período" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_PRESETS.map((preset) => (
            <SelectItem key={preset.label} value={preset.days.toString()}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustomPeriod && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !customDateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange?.from ? (
                customDateRange.to ? (
                  <>
                    {format(customDateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(customDateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(customDateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Selecione período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customDateRange?.from}
              selected={customDateRange}
              onSelect={handleCustomDateChange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
