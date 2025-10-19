import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportInsightsCardProps {
  insights: {
    bestDay: { day: string; conversions: number; rate: number };
    bestHour: { hour: number; conversions: number };
    peakTraffic: { day: string; views: number };
    opportunities: string[];
  };
}

export const ReportInsightsCard = ({ insights }: ReportInsightsCardProps) => {
  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm bg-gradient-to-br from-purple-500/5 to-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          💡 Insights Automáticos
        </CardTitle>
        <CardDescription>
          Análise inteligente dos padrões de conversão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Day */}
        <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Melhor Dia</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{insights.bestDay.day}</span> teve{' '}
              <Badge variant="secondary" className="ml-1">
                {insights.bestDay.conversions} conversões
              </Badge>{' '}
              com taxa de{' '}
              <span className="text-green-600 font-semibold">
                {insights.bestDay.rate.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>

        {/* Best Hour */}
        <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Horário de Pico</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{insights.bestHour.hour}h</span> é o horário com mais conversões{' '}
              <Badge variant="secondary" className="ml-1">
                {insights.bestHour.conversions} conversões
              </Badge>
            </p>
          </div>
        </div>

        {/* Peak Traffic */}
        <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Eye className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Maior Tráfego</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{insights.peakTraffic.day}</span> teve o maior volume{' '}
              <Badge variant="secondary" className="ml-1">
                {insights.peakTraffic.views.toLocaleString()} views
              </Badge>
            </p>
          </div>
        </div>

        {/* Opportunities */}
        {insights.opportunities.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              🎯 Oportunidades Identificadas
            </p>
            {insights.opportunities.map((opp, i) => (
              <div 
                key={i} 
                className="text-xs text-muted-foreground p-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
              >
                • {opp}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
