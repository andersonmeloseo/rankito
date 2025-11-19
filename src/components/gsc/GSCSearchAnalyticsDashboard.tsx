import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGSCSearchAnalytics } from '@/hooks/useGSCSearchAnalytics';
import { TrendingUp, MousePointerClick, Eye, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface GSCSearchAnalyticsDashboardProps {
  siteId: string;
}

export const GSCSearchAnalyticsDashboard = ({ siteId }: GSCSearchAnalyticsDashboardProps) => {
  const { analytics, aggregates, isLoading } = useGSCSearchAnalytics(siteId, {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Impressões</p>
                <p className="text-2xl font-bold mt-1">
                  {aggregates?.totalImpressions?.toLocaleString() || 0}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cliques</p>
                <p className="text-2xl font-bold mt-1">
                  {aggregates?.totalClicks?.toLocaleString() || 0}
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CTR Médio</p>
                <p className="text-2xl font-bold mt-1">
                  {aggregates?.avgCtr ? `${aggregates.avgCtr.toFixed(2)}%` : '0%'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posição Média</p>
                <p className="text-2xl font-bold mt-1">
                  {aggregates?.avgPosition ? aggregates.avgPosition.toFixed(1) : 'N/A'}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Top 10 Páginas por Impressões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregates?.topPages && aggregates.topPages.length > 0 ? (
                  aggregates.topPages.map((page, index) => (
                    <TableRow key={page.page} className="h-16">
                      <TableCell className="font-medium">
                        <Badge variant="outline">{index + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-md truncate">{page.page}</TableCell>
                      <TableCell className="text-right">{page.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{page.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{page.ctr.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum dado de analytics disponível ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
