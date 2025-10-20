import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface ConversionFunnelChartProps {
  totalViews: number;
  totalInteractions: number;
  totalConversions: number;
}

export const ConversionFunnelChart = ({ 
  totalViews, 
  totalInteractions, 
  totalConversions 
}: ConversionFunnelChartProps) => {
  const stages = [
    { 
      label: 'Visualizações', 
      value: totalViews, 
      percentage: 100,
      color: 'hsl(var(--chart-2))',
      gradient: 'from-blue-500/20 to-blue-600/10'
    },
    { 
      label: 'Interações', 
      value: totalInteractions, 
      percentage: totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0,
      color: 'hsl(var(--chart-1))',
      gradient: 'from-purple-500/20 to-purple-600/10'
    },
    { 
      label: 'Conversões', 
      value: totalConversions, 
      percentage: totalViews > 0 ? (totalConversions / totalViews) * 100 : 0,
      color: 'hsl(var(--chart-3))',
      gradient: 'from-green-500/20 to-green-600/10'
    },
  ];

  return (
    <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label} className="animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{stage.label}</span>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color: stage.color }}>
                    {stage.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div 
                className={`relative h-16 rounded-xl bg-gradient-to-r ${stage.gradient} border border-border/50 flex items-center justify-center overflow-hidden transition-all duration-500 hover:scale-[1.02]`}
                style={{ 
                  width: `${stage.percentage}%`,
                  minWidth: '30%',
                  boxShadow: `0 4px 20px ${stage.color}20`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                <span className="relative z-10 font-bold text-foreground">{stage.label}</span>
              </div>
              {index < stages.length - 1 && (
                <div className="flex items-center justify-center py-2">
                  <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    ↓ {((stages[index + 1].value / stage.value) * 100).toFixed(1)}% avançam
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
