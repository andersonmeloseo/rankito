import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversionHeatmapChartProps {
  data: Record<string, number>;
  isLoading?: boolean;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`);

export const ConversionHeatmapChart = ({ data, isLoading }: ConversionHeatmapChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...Object.values(data || {}), 1);

  const getIntensity = (value: number) => {
    if (!value) return 0;
    return (value / maxValue) * 100;
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return "hsl(var(--muted))";
    if (intensity < 25) return "hsl(var(--chart-1) / 0.3)";
    if (intensity < 50) return "hsl(var(--chart-1) / 0.5)";
    if (intensity < 75) return "hsl(var(--chart-1) / 0.7)";
    return "hsl(var(--chart-1))";
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mapa de Calor de Conversões
          </CardTitle>
          <CardDescription>Conversões por hora e dia da semana</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Mapa de Calor de Conversões
        </CardTitle>
        <CardDescription>Identificar os melhores horários para conversão</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-25 gap-1 mb-2">
              <div className="text-xs text-muted-foreground"></div>
              {HOURS.map((hour) => (
                <div key={hour} className="text-xs text-muted-foreground text-center">
                  {hour}
                </div>
              ))}
            </div>
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="grid grid-cols-25 gap-1 mb-1">
                <div className="text-xs text-muted-foreground flex items-center">
                  {day}
                </div>
                {Array.from({ length: 24 }).map((_, hourIndex) => {
                  const key = `${dayIndex}-${hourIndex}`;
                  const value = data[key] || 0;
                  const intensity = getIntensity(value);
                  const color = getColor(intensity);

                  return (
                    <div
                      key={key}
                      className="aspect-square rounded transition-all hover:scale-110 cursor-pointer flex items-center justify-center text-xs"
                      style={{ backgroundColor: color }}
                      title={`${day} ${hourIndex}h: ${value} conversões`}
                    >
                      {value > 0 && <span className="text-foreground font-medium">{value}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
