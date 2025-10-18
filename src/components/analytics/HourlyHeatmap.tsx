import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface HourlyHeatmapProps {
  data: { hour: number; count: number }[];
  isLoading: boolean;
}

export const HourlyHeatmap = ({ data, isLoading }: HourlyHeatmapProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Horários de Pico</CardTitle>
          <CardDescription>Distribuição de conversões por hora do dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <Card className="shadow-lg border-border/50 animate-fade-in hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⏰ Horários de Pico
        </CardTitle>
        <CardDescription>Distribuição de conversões por hora do dia (0-23h)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 24 }, (_, i) => {
            const hourData = data.find(d => d.hour === i);
            const count = hourData?.count || 0;
            const intensity = maxCount > 0 ? (count / maxCount) : 0;
            
            return (
              <div key={i} className="flex flex-col items-center gap-1 group">
                <div
                  className="w-full h-16 rounded-lg transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundColor: intensity > 0 
                      ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})` 
                      : "hsl(var(--muted) / 0.3)",
                    border: intensity > 0.7 ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  }}
                  title={`${i}h: ${count} conversões`}
                >
                  {count > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {count}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{i}h</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/30"></div>
            <span>Sem conversões</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--primary) / 0.5)' }}></div>
            <span>Médio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
            <span>Alto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};