import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown } from "lucide-react";

interface FunnelData {
  totalSessions: number;
  multiPageSessions: number;
  clickedSessions: number;
  convertedSessions: number;
}

interface JourneyFunnelChartProps {
  data: FunnelData;
}

export const JourneyFunnelChart = ({ data }: JourneyFunnelChartProps) => {
  const funnelData = [
    { 
      stage: 'Entrada', 
      value: data.totalSessions, 
      percentage: 100,
      color: '#10b981'
    },
    { 
      stage: 'Navegação', 
      value: data.multiPageSessions, 
      percentage: data.totalSessions > 0 ? (data.multiPageSessions / data.totalSessions) * 100 : 0,
      color: '#f59e0b'
    },
    { 
      stage: 'Interação', 
      value: data.clickedSessions, 
      percentage: data.totalSessions > 0 ? (data.clickedSessions / data.totalSessions) * 100 : 0,
      color: '#f97316'
    },
    { 
      stage: 'Conversão', 
      value: data.convertedSessions, 
      percentage: data.totalSessions > 0 ? (data.convertedSessions / data.totalSessions) * 100 : 0,
      color: '#ef4444'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical">
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="stage" width={90} />
            <Tooltip 
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-background p-3 border rounded-lg shadow-lg">
                    <div className="font-semibold">{data.stage}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.value} sessões ({data.percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Drop-off indicators */}
        <div className="mt-6 space-y-3 border-t pt-4">
          {funnelData.slice(1).map((stage, index) => {
            const previousStage = funnelData[index];
            const dropOff = previousStage.value - stage.value;
            const dropOffPercentage = previousStage.value > 0 
              ? ((dropOff / previousStage.value) * 100).toFixed(1)
              : '0';
            
            return (
              <div key={stage.stage} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {previousStage.stage} → {stage.stage}
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {dropOffPercentage}% ({dropOff} sessões)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
