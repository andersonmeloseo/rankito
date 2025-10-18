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

const truncatePath = (path: string, maxLength: number = 30) => {
  if (path.length <= maxLength) return path;
  return path.substring(0, maxLength - 3) + "...";
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

  // Top 9 páginas por visualizações (melhor visualização)
  const topPages = data.slice(0, 9).map(item => ({
    ...item,
    pageShort: truncatePath(item.page, 25),
  }));

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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topPages} margin={{ bottom: 80, left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="pageShort" 
              stroke="hsl(var(--muted-foreground))"
              angle={-35}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11 }}
              label={{ value: 'Visualizações', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-card-hover)",
                padding: "12px"
              }}
              formatter={(value: any, name: string) => {
                if (name === "views") return [value, "Visualizações"];
                if (name === "conversions") return [value, "Conversões"];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const fullPath = payload?.[0]?.payload?.page || label;
                return (
                  <div className="font-medium text-xs">
                    <div className="text-muted-foreground mb-1">Página:</div>
                    <div className="text-foreground break-all">{fullPath}</div>
                  </div>
                );
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "10px" }}
              iconType="circle"
            />
            <Bar 
              dataKey="views" 
              name="Visualizações"
              radius={[6, 6, 0, 0]}
              animationDuration={1000}
            >
              {topPages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorByPerformance(entry.conversionRate)} />
              ))}
            </Bar>
            <Bar 
              dataKey="conversions" 
              name="Conversões"
              fill="hsl(var(--chart-5))" 
              radius={[6, 6, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};