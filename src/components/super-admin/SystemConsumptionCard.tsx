import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Globe, FileText, TrendingUp, Search, MapPin, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SystemConsumptionCardProps {
  metrics: {
    global: {
      totalSites: number;
      totalPages: number;
      totalConversions: number;
      gscRequestsLast30Days: number;
      activeGscIntegrations: number;
      geoRequestsLast30Days: number;
    };
    evolution: Array<{
      date: string;
      conversions: number;
    }>;
  };
}

const MetricBox = ({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle?: string;
}) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
    <div className="p-2 rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString('pt-BR')}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  </div>
);

export const SystemConsumptionCard = ({ metrics }: SystemConsumptionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Consumo de Recursos do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Metrics - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricBox
            icon={<Globe className="h-5 w-5" />}
            label="Sites Cadastrados"
            value={metrics.global.totalSites}
          />
          <MetricBox
            icon={<FileText className="h-5 w-5" />}
            label="Páginas Totais"
            value={metrics.global.totalPages}
          />
          <MetricBox
            icon={<TrendingUp className="h-5 w-5" />}
            label="Conversões"
            value={metrics.global.totalConversions}
          />
        </div>

        {/* API Metrics - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricBox
            icon={<Search className="h-5 w-5" />}
            label="Indexações GSC (30d)"
            value={metrics.global.gscRequestsLast30Days}
            subtitle={`${metrics.global.activeGscIntegrations} integrações ativas`}
          />
          <MetricBox
            icon={<MapPin className="h-5 w-5" />}
            label="Geolocalizações (30d)"
            value={metrics.global.geoRequestsLast30Days}
          />
          <MetricBox
            icon={<Activity className="h-5 w-5" />}
            label="Média Diária"
            value={Math.round(metrics.global.totalConversions / 30)}
            subtitle="conversões/dia"
          />
        </div>

        {/* Evolution Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Evolução de Conversões (30 dias)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics.evolution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tickFormatter={(date) => new Date(date).getDate().toString()}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
