import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Eye, DollarSign, Target, Activity, Calendar, Repeat2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  nextPaymentDate?: string | null;
  nextPaymentAmount?: number;
  paymentStatus?: 'current' | 'overdue' | 'due_soon';
  showProjectSwitch?: boolean;
  onSwitchProject?: () => void;
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
  conversionTrend = 'up',
  viewsTrend = 'up',
  daysRemaining,
  contractStatus,
  nextPaymentDate,
  nextPaymentAmount,
  paymentStatus,
  showProjectSwitch = false,
  onSwitchProject,
}: EpicPortalHeaderProps) => {
  const initials = clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{clientName}</h1>
              {clientCompany && (
                <p className="text-muted-foreground text-base mt-1">{clientCompany}</p>
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
            {showProjectSwitch && onSwitchProject && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSwitchProject}
                className="text-xs"
              >
                <Repeat2 className="h-3 w-3 mr-1.5" />
                Trocar de Projeto
              </Button>
            )}
            {liveConversionsCount > 0 && (
              <Badge className="bg-red-500 text-white px-3 py-1.5 text-xs">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                AO VIVO {liveConversionsCount > 0 && `+${liveConversionsCount}`}
              </Badge>
            )}
            {contractStatus && daysRemaining !== null && (
              <Badge variant={contractStatus === 'active' ? 'default' : 'secondary'} className="text-xs">
                {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Contrato expirado'}
              </Badge>
            )}
            {nextPaymentDate && (
              <Badge 
                variant={paymentStatus === 'overdue' ? 'destructive' : paymentStatus === 'due_soon' ? 'secondary' : 'default'}
                className="text-xs flex items-center gap-1.5"
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(nextPaymentDate), 'dd/MM/yyyy', { locale: ptBR })} - R$ {nextPaymentAmount?.toLocaleString('pt-BR')}
                {paymentStatus === 'overdue' && ' (ATRASADO)'}
                {paymentStatus === 'due_soon' && ' (VENCE EM BREVE)'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Conversões */}
        <Card className="bg-card border border-border hover:shadow-lg transition-shadow duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              {conversionTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Conversões</p>
            <p className="text-4xl font-bold text-foreground mb-1">{totalConversions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              Taxa: {conversionRate.toFixed(2)}%
            </p>
          </div>
        </Card>

        {/* Visualizações */}
        <Card className="bg-card border border-border hover:shadow-lg transition-shadow duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              {viewsTrend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Visualizações</p>
            <p className="text-4xl font-bold text-foreground mb-1">{totalPageViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </div>
        </Card>

        {/* Receita */}
        <Card className="bg-card border border-border hover:shadow-lg transition-shadow duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Receita Mensal</p>
            <p className="text-4xl font-bold text-foreground mb-1">
              R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">
              Por conversão: R$ {totalConversions > 0 ? (monthlyRevenue / totalConversions).toFixed(2) : '0.00'}
            </p>
          </div>
        </Card>

        {/* Tempo Real */}
        <Card className="bg-card border border-border hover:shadow-lg transition-shadow duration-200">
          <div className="p-8">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Agora</p>
            <p className="text-4xl font-bold text-primary mb-1">{liveConversionsCount}</p>
            <p className="text-xs text-muted-foreground">Conversões ativas</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
