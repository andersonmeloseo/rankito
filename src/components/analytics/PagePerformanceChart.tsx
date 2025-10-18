import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Loader2, FileText } from "lucide-react";

interface PagePerformanceChartProps {
  data: { page: string; views: number; conversions: number; conversionRate: number }[];
  isLoading: boolean;
}

const getColorByPerformance = (conversionRate: number) => {
  if (conversionRate >= 5) return "hsl(var(--chart-1))"; // Verde - Excelente
  if (conversionRate >= 2) return "hsl(var(--chart-2))"; // Azul - Bom
  if (conversionRate >= 1) return "hsl(var(--chart-3))"; // Amarelo - Médio
  return "hsl(var(--chart-4))"; // Vermelho - Baixo
};

export const PagePerformanceChart = ({ data, isLoading }: PagePerformanceChartProps) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle>Performance por Página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
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
          <CardTitle>Performance por Página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Sem dados de performance disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  // Top 10 páginas por visualizações
  const topPages = data.slice(0, 10);

  return (
    <Card className="shadow-lg border-border/50 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Performance por Página
        </CardTitle>
        <CardDescription>
          Top {topPages.length} páginas mais visitadas com suas taxas de conversão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span>≥5% - Excelente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span>2-5% - Bom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
            <span>1-2% - Médio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
            <span>&lt;1% - Baixo</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={topPages}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="page" 
              stroke="hsl(var(--muted-foreground))"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              label={{ value: 'Visualizações', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === "views") return [value, "Visualizações"];
                if (name === "conversions") return [value, "Conversões"];
                return [value, name];
              }}
              labelFormatter={(label) => `Página: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="views" 
              name="Visualizações"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            >
              {topPages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorByPerformance(entry.conversionRate)} />
              ))}
            </Bar>
            <Bar 
              dataKey="conversions" 
              name="Conversões"
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};