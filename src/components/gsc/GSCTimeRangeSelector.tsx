import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { timeRanges, type TimeRange } from "@/hooks/useGSCTimeRange";

interface Props {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export const GSCTimeRangeSelector = ({ value, onChange }: Props) => {
  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex gap-1">
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            variant={value === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
