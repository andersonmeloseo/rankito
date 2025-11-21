import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ShoppingCart,
  FileText,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import type { Insight } from '@/hooks/useEcommerceInsights';

interface InsightCardProps {
  insight: Insight;
}

const typeConfig = {
  opportunity: {
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  info: {
    icon: Info,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

const categoryConfig = {
  product: { icon: ShoppingCart, label: 'Produto' },
  page: { icon: FileText, label: 'Página' },
  funnel: { icon: BarChart3, label: 'Funil' },
  revenue: { icon: DollarSign, label: 'Receita' }
};

const impactConfig = {
  high: { label: 'Alto Impacto', variant: 'destructive' as const },
  medium: { label: 'Médio Impacto', variant: 'default' as const },
  low: { label: 'Baixo Impacto', variant: 'secondary' as const }
};

export const InsightCard = ({ insight }: InsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeStyle = typeConfig[insight.type];
  const TypeIcon = typeStyle.icon;
  const categoryStyle = categoryConfig[insight.category];
  const CategoryIcon = categoryStyle.icon;
  const impactStyle = impactConfig[insight.impact];

  return (
    <Card className={`border-l-4 ${typeStyle.borderColor} hover:shadow-lg transition-all`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${typeStyle.bgColor}`}>
            <TypeIcon className={`h-6 w-6 ${typeStyle.color}`} />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={impactStyle.variant} className="text-xs">
                    {impactStyle.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <CategoryIcon className="h-3 w-3" />
                    {categoryStyle.label}
                  </Badge>
                </div>
                <h3 className="font-semibold text-base text-foreground">
                  {insight.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {insight.description}
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs hover:bg-secondary/80 -ml-2"
            >
              {isExpanded ? (
                <>
                  Ocultar Recomendação <ChevronUp className="ml-1 h-3 w-3" />
                </>
              ) : (
                <>
                  Ver Recomendação <ChevronDown className="ml-1 h-3 w-3" />
                </>
              )}
            </Button>

            {isExpanded && (
              <div className={`p-4 rounded-lg ${typeStyle.bgColor} border ${typeStyle.borderColor} space-y-3`}>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    💡 Recomendação:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {insight.recommendation}
                  </p>
                </div>

                {insight.data?.product && (
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a href="#produtos" className="flex items-center gap-1">
                      Ver Produto <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}

                {insight.data?.page && (
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <a href={insight.data.page.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      Abrir Página <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
