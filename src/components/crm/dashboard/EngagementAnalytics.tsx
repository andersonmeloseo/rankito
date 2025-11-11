import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Clock, MousePointer, TrendingUp } from "lucide-react";
import { EngagementBadge } from "@/components/crm/cards/EngagementBadge";

interface EngagementAnalyticsProps {
  deals: any[];
}

export const EngagementAnalytics = ({ deals }: EngagementAnalyticsProps) => {
  const dealsWithEngagement = deals.filter(d => d.source_metadata?.engagement_score);
  
  const avgScore = dealsWithEngagement.length > 0
    ? Math.round(
        dealsWithEngagement.reduce((sum, d) => sum + d.source_metadata.engagement_score, 0) / 
        dealsWithEngagement.length
      )
    : 0;
    
  const avgTime = dealsWithEngagement.length > 0
    ? Math.round(
        dealsWithEngagement.reduce((sum, d) => sum + (d.source_metadata.time_on_page || 0), 0) / 
        dealsWithEngagement.length
      )
    : 0;
    
  const avgScroll = dealsWithEngagement.length > 0
    ? Math.round(
        dealsWithEngagement.reduce((sum, d) => sum + (d.source_metadata.scroll_depth || 0), 0) / 
        dealsWithEngagement.length
      )
    : 0;

  if (dealsWithEngagement.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Análise de Engajamento
        </CardTitle>
        <CardDescription>
          Métricas de comportamento dos leads ({dealsWithEngagement.length} leads com dados)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-4 bg-accent/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Score Médio</div>
            <EngagementBadge score={avgScore} size="lg" />
          </div>
          
          <div className="flex flex-col items-center gap-2 p-4 bg-accent/50 rounded-lg">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Tempo Médio</div>
            <div className="text-2xl font-bold">
              {Math.floor(avgTime / 60)}:{(avgTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 p-4 bg-accent/50 rounded-lg">
            <MousePointer className="w-5 h-5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Scroll Médio</div>
            <div className="text-2xl font-bold">{avgScroll}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
