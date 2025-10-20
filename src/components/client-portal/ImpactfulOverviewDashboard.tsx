import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, Eye } from 'lucide-react';
import { ModernAreaChart } from './charts/ModernAreaChart';

interface PageMetric {
  page_path: string;
  page_title?: string;
  conversions: number;
  pageViews: number;
  conversionRate: number;
}

interface DailyStat {
  date: string;
  conversions: number;
  pageViews: number;
}

interface ImpactfulOverviewDashboardProps {
  dailyStats: DailyStat[];
  topPages: PageMetric[];
  totalConversions: number;
  totalPageViews: number;
  onViewAllPages?: () => void;
}

export const ImpactfulOverviewDashboard = ({
  dailyStats,
  topPages,
  totalConversions,
  totalPageViews,
  onViewAllPages,
}: ImpactfulOverviewDashboardProps) => {
  const top5Pages = topPages.slice(0, 5);
  const conversionRate = totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Main Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ModernAreaChart data={dailyStats} title="Performance ao Longo do Tempo" />
        </div>
        
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConversions}</p>
              <p className="text-xs text-muted-foreground">Total de Conversões</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalPageViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total de Visualizações</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{conversionRate.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Pages */}
      <Card className="bg-card border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Top 5 Páginas Convertendo</CardTitle>
          {onViewAllPages && (
            <Button variant="ghost" size="sm" onClick={onViewAllPages}>
              Ver todas
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {top5Pages.map((page, index) => (
              <div key={page.page_path} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl font-bold text-muted-foreground">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{page.page_title || page.page_path}</p>
                    <p className="text-xs text-muted-foreground truncate">{page.page_path}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-foreground">{page.conversions}</p>
                  <p className="text-xs text-muted-foreground">{page.conversionRate.toFixed(1)}% taxa</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Visualizações → Conversões</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalPageViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">→ {totalConversions} conversões ({conversionRate.toFixed(2)}%)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Mais Visualizada</p>
            </div>
            <p className="text-xl font-bold text-foreground truncate">{top5Pages[0]?.page_title || top5Pages[0]?.page_path || 'N/A'}</p>
            <p className="text-sm text-muted-foreground mt-1">{top5Pages[0]?.pageViews.toLocaleString() || 0} visualizações</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Melhor Taxa</p>
            </div>
            <p className="text-xl font-bold text-foreground truncate">{top5Pages[0]?.page_title || top5Pages[0]?.page_path || 'N/A'}</p>
            <p className="text-sm text-muted-foreground mt-1">{top5Pages[0]?.conversionRate.toFixed(1) || 0}% taxa de conversão</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
