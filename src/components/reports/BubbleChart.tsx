import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scatter, ScatterChart, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BubbleDataPoint {
  name: string;
  pageViews: number;
  conversions: number;
  conversionRate: number;
}

interface BubbleChartProps {
  data: BubbleDataPoint[];
  isLoading?: boolean;
}

export const BubbleChart = ({ data, isLoading }: BubbleChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🫧 Análise de Bolhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepara dados para o gráfico
  const chartData = data.map(item => ({
    x: item.pageViews,
    y: item.conversions,
    z: item.conversionRate * 100, // Tamanho da bolha
    name: item.name,
    conversionRate: item.conversionRate
  }));

  // Calcula cores baseado na taxa de conversão
  const getColor = (rate: number) => {
    if (rate > 10) return "hsl(142, 71%, 45%)"; // verde
    if (rate > 5) return "hsl(48, 96%, 53%)"; // amarelo
    return "hsl(0, 72%, 51%)"; // vermelho
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <p className="text-xs">Page Views: <span className="font-bold">{data.x.toLocaleString()}</span></p>
          <p className="text-xs">Conversões: <span className="font-bold">{data.y.toLocaleString()}</span></p>
          <p className="text-xs">Taxa: <span className="font-bold">{data.conversionRate.toFixed(2)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🫧 Análise de Bolhas - Performance por Página</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tamanho da bolha = Taxa de conversão • Cor: 🟢 Excelente {'>'}10% • 🟡 Bom 5-10% • 🔴 Melhorar {'<'}5%
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Page Views"
              label={{ value: 'Page Views', position: 'bottom', offset: 40 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Conversões"
              label={{ value: 'Conversões', angle: -90, position: 'left', offset: 40 }}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[100, 2000]} 
              name="Taxa"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={chartData}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.conversionRate)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legenda e insights */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <p className="text-sm font-semibold">📊 Análise:</p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium">Alta Performance</span>
              </div>
              <p className="text-muted-foreground ml-5">
                {chartData.filter(d => d.conversionRate > 10).length} páginas
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="font-medium">Performance Média</span>
              </div>
              <p className="text-muted-foreground ml-5">
                {chartData.filter(d => d.conversionRate > 5 && d.conversionRate <= 10).length} páginas
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="font-medium">Precisa Melhorar</span>
              </div>
              <p className="text-muted-foreground ml-5">
                {chartData.filter(d => d.conversionRate <= 5).length} páginas
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
