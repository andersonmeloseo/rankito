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
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Horários de Pico</CardTitle>
        <CardDescription>Distribuição de conversões por hora do dia</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 24 }, (_, i) => {
            const hourData = data.find(d => d.hour === i);
            const count = hourData?.count || 0;
            const intensity = maxCount > 0 ? (count / maxCount) : 0;
            
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-full h-16 rounded transition-all hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: intensity > 0 
                      ? `hsl(var(--primary) / ${0.2 + intensity * 0.8})` 
                      : "hsl(var(--muted))",
                  }}
                  title={`${i}h: ${count} conversões`}
                />
                <span className="text-xs text-muted-foreground">{i}h</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};