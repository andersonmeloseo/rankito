import { useState } from "react";
import { format, subDays, subMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  onPeriodChange: (startDate: string, endDate: string) => void;
  defaultPeriod?: number;
}

const PRESET_PERIODS = [
  { label: "Últimos 7 dias", value: "7", unit: "days" as const },
  { label: "Últimos 14 dias", value: "14", unit: "days" as const },
  { label: "Últimos 21 dias", value: "21", unit: "days" as const },
  { label: "Últimos 30 dias", value: "30", unit: "days" as const },
  { label: "Últimos 3 meses", value: "3", unit: "months" as const },
  { label: "Últimos 6 meses", value: "6", unit: "months" as const },
  { label: "Últimos 9 meses", value: "9", unit: "months" as const },
  { label: "Último ano", value: "12", unit: "months" as const },
  { label: "Período customizado", value: "custom", unit: "custom" as const },
];

export const PeriodSelector = ({ onPeriodChange, defaultPeriod = 30 }: PeriodSelectorProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod.toString());
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomRange, setShowCustomRange] = useState(false);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    
    if (value === "custom") {
      setShowCustomRange(true);
      return;
    }

    setShowCustomRange(false);
    const preset = PRESET_PERIODS.find(p => p.value === value);
    if (!preset || preset.unit === "custom") return;

    const endDate = new Date();
    const startDate = preset.unit === "days" 
      ? subDays(endDate, parseInt(value))
      : subMonths(endDate, parseInt(value));

    onPeriodChange(
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd")
    );
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onPeriodChange(
        format(customStartDate, "yyyy-MM-dd"),
        format(customEndDate, "yyyy-MM-dd")
      );
      setShowCustomRange(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecionar período" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_PERIODS.map((period) => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustomRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              {customStartDate && customEndDate ? (
                <>
                  {format(customStartDate, "dd/MM/yyyy")} - {format(customEndDate, "dd/MM/yyyy")}
                </>
              ) : (
                <span>Selecionar datas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Data Inicial</p>
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                  className={cn("pointer-events-auto")}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Data Final</p>
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  disabled={(date) => customStartDate ? date < customStartDate : false}
                  className={cn("pointer-events-auto")}
                />
              </div>
              <Button 
                onClick={handleCustomDateApply} 
                className="w-full"
                disabled={!customStartDate || !customEndDate}
              >
                Aplicar Período
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};