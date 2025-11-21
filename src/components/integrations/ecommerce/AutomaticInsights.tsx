import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter } from 'lucide-react';
import { useEcommerceAnalytics } from '@/hooks/useEcommerceAnalytics';
import { useEcommerceInsights } from '@/hooks/useEcommerceInsights';
import { EcommerceHealthScore } from './EcommerceHealthScore';
import { InsightCard } from './InsightCard';
import type { Insight } from '@/hooks/useEcommerceInsights';

interface AutomaticInsightsProps {
  siteId: string;
  days: number;
}

type FilterType = 'all' | 'opportunity' | 'warning' | 'success' | 'info';

export const AutomaticInsights = ({ siteId, days }: AutomaticInsightsProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    metrics,
    previousMetrics,
    products,
    pages,
    isLoading
  } = useEcommerceAnalytics(siteId, days);

  const { insights, healthScore } = useEcommerceInsights(
    metrics,
    previousMetrics,
    products,
    pages
  );

  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  const counts = useMemo(() => {
    return {
      all: insights.length,
      opportunity: insights.filter(i => i.type === 'opportunity').length,
      warning: insights.filter(i => i.type === 'warning').length,
      success: insights.filter(i => i.type === 'success').length,
      info: insights.filter(i => i.type === 'info').length
    };
  }, [insights]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted/50 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-muted/50 animate-pulse rounded-lg" />
          <div className="h-48 bg-muted/50 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" key={refreshKey}>
      {/* Health Score */}
      <EcommerceHealthScore healthScore={healthScore} />

      {/* Cabeçalho com Filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              Insights Automáticos
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Análise
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex items-center gap-2"
          >
            Todos
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts.all}
            </Badge>
          </Button>
          <Button
            variant={filter === 'opportunity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('opportunity')}
            className="flex items-center gap-2"
          >
            Oportunidades
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts.opportunity}
            </Badge>
          </Button>
          <Button
            variant={filter === 'warning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('warning')}
            className="flex items-center gap-2"
          >
            Alertas
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts.warning}
            </Badge>
          </Button>
          <Button
            variant={filter === 'success' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('success')}
            className="flex items-center gap-2"
          >
            Sucessos
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts.success}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Grid de Insights */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'Nenhum insight detectado no momento. Continue coletando dados para análises mais profundas.'
              : `Nenhum insight do tipo "${filter}" detectado.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
};
