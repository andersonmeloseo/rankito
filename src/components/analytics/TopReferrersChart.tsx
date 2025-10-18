import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopReferrersChartProps {
  data: { referrer: string; count: number; percentage: number }[];
  isLoading: boolean;
}

const COLORS = [
  "#3B82F6", // Azul vibrante
  "#10B981", // Verde esmeralda
  "#F59E0B", // Laranja âmbar
  "#8B5CF6", // Roxo vibrante
  "#EF4444", // Vermelho coral
  "#14B8A6", // Teal
  "#F97316", // Laranja forte
  "#6366F1", // Indigo
];

export const TopReferrersChart = ({ data, isLoading }: TopReferrersChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle>Top Origens de Tráfego</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle>Top Origens de Tráfego</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados de referência disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  const directTraffic = data.find(d => d.referrer === "Direto");
  const totalViews = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              Top Origens de Tráfego
            </CardTitle>
            <CardDescription>De onde vêm seus visitantes</CardDescription>
          </div>
          {directTraffic && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Tráfego Direto</div>
              <Badge variant="secondary" className="text-lg">
                {directTraffic.percentage.toFixed(1)}%
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="referrer" 
              stroke="hsl(var(--muted-foreground))"
              width={150}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} visitas (${props.payload.percentage.toFixed(1)}%)`,
                "Visitas"
              ]}
            />
            <Bar 
              dataKey="count" 
              radius={[0, 8, 8, 0]}
              animationDuration={1000}
            >
              {data.slice(0, 10).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};