import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface MiniHeatmapProps {
  data: Array<{ hour: number; day: number; value: number }>;
  title?: string;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MiniHeatmap = ({ data, title = 'Mapa de Calor - Horários' }: MiniHeatmapProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-muted/30';
    if (intensity < 0.25) return 'bg-chart-3/30';
    if (intensity < 0.5) return 'bg-chart-4/50';
    if (intensity < 0.75) return 'bg-chart-1/70';
    return 'bg-chart-1/90';
  };

  const getValue = (day: number, hour: number) => {
    const entry = data.find(d => d.day === day && d.hour === hour);
    return entry?.value || 0;
  };

  return (
    <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Flame className="h-5 w-5 text-chart-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Hours header */}
          <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-xs text-muted-foreground mb-2">
            <div></div>
            {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 4 === 0).map(hour => (
              <div key={hour} className="col-span-4 text-center">{hour}h</div>
            ))}
          </div>

          {/* Heatmap grid */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 items-center">
              <div className="text-xs font-medium text-muted-foreground">{day}</div>
              {Array.from({ length: 24 }, (_, hour) => {
                const value = getValue(dayIndex, hour);
                return (
                  <div
                    key={hour}
                    className={`aspect-square rounded-sm ${getColor(value)} transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer flex items-center justify-center`}
                    title={`${day} ${hour}h: ${value} conversões`}
                  >
                    {value > 0 && (
                      <span className="text-[8px] font-bold text-foreground">{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-sm ${getColor(intensity * maxValue)}`}
                />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
