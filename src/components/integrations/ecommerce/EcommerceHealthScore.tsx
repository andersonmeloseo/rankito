import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import type { HealthScore } from '@/hooks/useEcommerceInsights';

interface EcommerceHealthScoreProps {
  healthScore: HealthScore;
}

const statusConfig = {
  excellent: {
    label: 'Excelente',
    color: 'text-green-600',
    bgColor: 'bg-green-600',
    badgeVariant: 'default' as const,
    icon: CheckCircle
  },
  good: {
    label: 'Bom',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    badgeVariant: 'secondary' as const,
    icon: CheckCircle
  },
  fair: {
    label: 'Regular',
    color: 'text-orange-600',
    bgColor: 'bg-orange-600',
    badgeVariant: 'default' as const,
    icon: AlertCircle
  },
  poor: {
    label: 'Necessita Atenção',
    color: 'text-red-600',
    bgColor: 'bg-red-600',
    badgeVariant: 'destructive' as const,
    icon: XCircle
  }
};

export const EcommerceHealthScore = ({ healthScore }: EcommerceHealthScoreProps) => {
  const config = statusConfig[healthScore.status];
  const StatusIcon = config.icon;

  const criteriaLabels = {
    conversionRate: 'Taxa de Conversão',
    cartAbandonment: 'Abandono de Carrinho',
    revenueGrowth: 'Crescimento de Receita',
    productDiversity: 'Diversificação de Produtos',
    pagePerformance: 'Performance das Páginas'
  };

  return (
    <Card className="border-l-4 border-l-primary shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Saúde do E-commerce
          </CardTitle>
          <Badge variant={config.badgeVariant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Principal */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="text-5xl font-bold text-foreground">
              {healthScore.score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
          </div>
          <Progress 
            value={healthScore.score} 
            className="h-3"
          />
        </div>

        {/* Breakdown dos Critérios */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Detalhamento por Critério
          </p>
          
          <div className="space-y-3">
            {Object.entries(healthScore.breakdown).map(([key, value]) => {
              const label = criteriaLabels[key as keyof typeof criteriaLabels];
              let icon;
              if (value >= 70) icon = <CheckCircle className="h-4 w-4 text-green-600" />;
              else if (value >= 50) icon = <AlertCircle className="h-4 w-4 text-orange-600" />;
              else icon = <XCircle className="h-4 w-4 text-red-600" />;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <span className="font-medium text-foreground">{value}%</span>
                  </div>
                  <Progress value={value} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensagem de Status */}
        <div className={`p-4 rounded-lg bg-muted/50 border border-border`}>
          <p className="text-sm text-muted-foreground">
            {healthScore.score >= 80 && (
              <>
                <strong className="text-green-600">Parabéns!</strong> Seu e-commerce está com excelente saúde. Continue investindo nas estratégias atuais.
              </>
            )}
            {healthScore.score >= 60 && healthScore.score < 80 && (
              <>
                <strong className="text-blue-600">Bom desempenho!</strong> Existem oportunidades de melhoria para alcançar a excelência.
              </>
            )}
            {healthScore.score >= 40 && healthScore.score < 60 && (
              <>
                <strong className="text-orange-600">Atenção necessária.</strong> Revise os insights abaixo para identificar áreas críticas de melhoria.
              </>
            )}
            {healthScore.score < 40 && (
              <>
                <strong className="text-red-600">Ação urgente requerida.</strong> Priorize as recomendações de alto impacto para reverter a situação.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
