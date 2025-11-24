import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapData {
  day: number; // 0-6 (Dom-Sáb)
  hour: number; // 0-23
  count: number;
}

interface JourneyHeatmapGridProps {
  data: HeatmapData[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const JourneyHeatmapGrid = ({ data }: JourneyHeatmapGridProps) => {
  // Encontrar valor máximo para normalização
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Criar mapa para acesso rápido
  const dataMap = new Map<string, number>();
  data.forEach(d => {
    dataMap.set(`${d.day}-${d.hour}`, d.count);
  });

  const getIntensity = (count: number) => {
    const intensity = count / maxCount;
    if (intensity === 0) return 'bg-muted/30';
    if (intensity < 0.25) return 'bg-blue-200 dark:bg-blue-900/30';
    if (intensity < 0.5) return 'bg-blue-400 dark:bg-blue-700/50';
    if (intensity < 0.75) return 'bg-blue-600 dark:bg-blue-500/70';
    return 'bg-blue-800 dark:bg-blue-400';
  };

  // Mostrar todas as 24 horas
  const activeHours = HOURS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Mapa de Calor de Atividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-2">
            {/* Header com dias da semana */}
            <div className="grid grid-cols-8 gap-1">
              <div className="text-xs font-medium text-muted-foreground"></div>
              {DAYS.map((day, idx) => (
                <div key={idx} className="text-xs font-medium text-center text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de horas */}
            <div className="space-y-1">
              {activeHours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 gap-1">
                  <div className="text-xs font-medium text-muted-foreground flex items-center">
                    {hour.toString().padStart(2, '0')}h
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const count = dataMap.get(`${dayIdx}-${hour}`) || 0;
                    const intensity = getIntensity(count);
                    
                    // Determinar cor do texto baseada na intensidade
                    const isDarkBg = intensity.includes('blue-800') || intensity.includes('blue-600');
                    const textColorClass = count === 0 
                      ? 'text-muted-foreground' 
                      : isDarkBg
                        ? 'text-white dark:text-white'
                        : 'text-foreground';
                    
                    return (
                      <Tooltip key={`${dayIdx}-${hour}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`h-8 rounded ${intensity} cursor-pointer hover:ring-2 hover:ring-primary transition-all relative flex items-center justify-center group`}
                          >
                            {count > 0 && (
                              <span className={`text-[10px] font-bold opacity-70 group-hover:opacity-100 transition-opacity ${textColorClass}`}>
                                {count}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-semibold">{DAYS[dayIdx]}, {hour.toString().padStart(2, '0')}h</div>
                            <div className="text-muted-foreground">
                              {count} {count === 1 ? 'sessão' : 'sessões'}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">Baixo</span>
              <div className="flex gap-1">
                <div className="w-6 h-4 rounded bg-muted/30" />
                <div className="w-6 h-4 rounded bg-blue-200 dark:bg-blue-900/30" />
                <div className="w-6 h-4 rounded bg-blue-400 dark:bg-blue-700/50" />
                <div className="w-6 h-4 rounded bg-blue-600 dark:bg-blue-500/70" />
                <div className="w-6 h-4 rounded bg-blue-800 dark:bg-blue-400" />
              </div>
              <span className="text-xs text-muted-foreground">Alto</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
