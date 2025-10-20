import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Eye, DollarSign, Zap } from 'lucide-react';
import { Sparkline } from '@/components/analytics/Sparkline';

interface EpicPortalHeaderProps {
  clientName: string;
  clientCompany?: string;
  projectUrl?: string;
  liveConversionsCount: number;
  totalConversions: number;
  totalPageViews: number;
  monthlyRevenue: number;
  conversionRate: number;
  sparklineData?: number[];
  conversionTrend?: 'up' | 'down';
  viewsTrend?: 'up' | 'down';
  daysRemaining?: number | null;
  contractStatus?: string;
}

export const EpicPortalHeader = ({
  clientName,
  clientCompany,
  projectUrl,
  liveConversionsCount,
  totalConversions,
  totalPageViews,
  monthlyRevenue,
  conversionRate,
  sparklineData = [],
  conversionTrend = 'up',
  viewsTrend = 'up',
  daysRemaining,
  contractStatus,
}: EpicPortalHeaderProps) => {
  const initials = clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 rounded-2xl p-8 border border-border/50">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{clientName}</h1>
              {clientCompany && (
                <p className="text-muted-foreground text-lg">{clientCompany}</p>
              )}
              {projectUrl && (
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm mt-1 inline-block"
                >
                  {projectUrl}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-sm font-bold shadow-lg animate-pulse"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              AO VIVO
              {liveConversionsCount > 0 && (
                <span className="ml-2 bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-extrabold">
                  +{liveConversionsCount}
                </span>
              )}
            </Badge>
            {contractStatus && daysRemaining !== null && (
              <Badge variant={contractStatus === 'active' ? 'default' : 'destructive'}>
                {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Contrato expirado'}
              </Badge>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Conversões */}
          <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Conversões</p>
                <p className="text-4xl font-bold text-foreground">{totalConversions.toLocaleString()}</p>
              </div>
              {conversionTrend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            {sparklineData.length > 0 && (
              <Sparkline data={sparklineData} color="#10b981" />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Taxa: {conversionRate.toFixed(2)}%
            </p>
          </Card>

          {/* Visualizações */}
          <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visualizações</p>
                <p className="text-4xl font-bold text-foreground">{totalPageViews.toLocaleString()}</p>
              </div>
              {viewsTrend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="h-12 flex items-end gap-1 mt-2">
              {sparklineData.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t"
                  style={{ height: `${(value / Math.max(...sparklineData)) * 100}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <Eye className="h-3 w-3 inline mr-1" />
              Últimos 7 dias
            </p>
          </Card>

          {/* Receita */}
          <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receita Mensal</p>
                <p className="text-4xl font-bold text-foreground">
                  R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Valor por conversão: R$ {totalConversions > 0 ? (monthlyRevenue / totalConversions).toFixed(2) : '0.00'}
              </p>
            </div>
          </Card>

          {/* Tempo Real */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur border-primary/20 hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Agora</p>
                  <p className="text-4xl font-bold text-primary">{liveConversionsCount}</p>
                </div>
                <Zap className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Conversões ativas
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
