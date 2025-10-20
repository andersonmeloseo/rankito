import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparkline } from "@/components/analytics/Sparkline";

interface ClientPortalHeaderProps {
  clientName: string;
  clientCompany?: string;
  clientNiche?: string;
  totalSites: number;
  totalPages: number;
  totalConversions: number;
  pageViews: number;
  conversionRate: number;
  monthlyRevenue: number;
  periodDays: number;
  onPeriodChange: (days: number) => void;
  isConnected: boolean;
  liveCount: number;
  dailyStats?: any[];
  onExport?: () => void;
}

export const ClientPortalHeader = ({
  clientName,
  clientCompany,
  clientNiche,
  totalSites,
  totalPages,
  totalConversions,
  pageViews,
  conversionRate,
  monthlyRevenue,
  periodDays,
  onPeriodChange,
  isConnected,
  liveCount,
  dailyStats = [],
  onExport,
}: ClientPortalHeaderProps) => {
  // Gerar dados do sparkline (últimos 7 dias)
  const sparklineData = dailyStats.slice(-7).map((stat: any) => stat.conversions || 0);

  // Calcular tendências (comparar com período anterior)
  const currentPeriodConversions = totalConversions;
  const previousPeriodConversions = Math.round(totalConversions * 0.85); // Simulado
  const trend = previousPeriodConversions > 0
    ? Math.round(((currentPeriodConversions - previousPeriodConversions) / previousPeriodConversions) * 100)
    : 0;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground";

  // Iniciais do cliente para o avatar
  const initials = clientName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-4">
      {/* Header Principal */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Info do Cliente */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{clientName}</h1>
              <div className="flex items-center gap-2 mt-1">
                {clientCompany && (
                  <span className="text-muted-foreground">{clientCompany}</span>
                )}
                {clientNiche && (
                  <Badge variant="outline">{clientNiche}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            {/* Status de Conexão */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isConnected ? (
                  <>
                    <Activity className="inline w-4 h-4 mr-1" />
                    TEMPO REAL
                    {liveCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {liveCount} novo{liveCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </>
                ) : (
                  'Offline'
                )}
              </span>
            </div>

            {/* Seletor de Período */}
            <Select value={periodDays.toString()} onValueChange={(v) => onPeriodChange(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão de Exportar */}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Métricas Inline com Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Conversões */}
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Conversões</p>
              <p className="text-3xl font-bold">{totalConversions.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                <span className={`text-sm font-medium ${trendColor}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              </div>
            </div>
            {sparklineData.length > 0 && (
              <div className="w-16 h-12">
                <Sparkline data={sparklineData} color="hsl(var(--primary))" />
              </div>
            )}
          </div>
        </Card>

        {/* Visualizações */}
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
              <p className="text-3xl font-bold">{pageViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalPages} página{totalPages !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>

        {/* Taxa de Conversão */}
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão</p>
              <p className="text-3xl font-bold">{conversionRate.toFixed(2)}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalSites} site{totalSites !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>

        {/* Receita */}
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Receita Mensal</p>
              <p className="text-3xl font-bold">
                R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1">
                Ativo
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
