import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernAreaChart } from "./charts/ModernAreaChart";
import { SmoothLineChart } from "./charts/SmoothLineChart";
import { DonutChart } from "./charts/DonutChart";
import { HeatmapChart } from "./charts/HeatmapChart";
import { ReportData } from "@/lib/reports/generateExcel";
import { ReportConfig } from "./ReportConfigPanel";

interface ReportPreviewProps {
  data: ReportData;
  config: ReportConfig;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  gradient: {
    start: number;
    end: number;
  };
}

export const ReportPreview = ({ data, config, colors, gradient }: ReportPreviewProps) => {
  return (
    <div className="space-y-6" id="report-preview">
      {/* Header */}
      <Card style={{ backgroundColor: colors.background, color: colors.text }}>
        <CardHeader>
          <CardTitle className="text-3xl">{data.name}</CardTitle>
          <p className="text-muted-foreground">
            Período: {data.period.start} até {data.period.end}
          </p>
        </CardHeader>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
          <CardContent className="pt-6 text-white">
            <div className="text-4xl font-bold mb-2">
              {data.summary.totalConversions.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm opacity-90">Total de Conversões</div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})` }}>
          <CardContent className="pt-6 text-white">
            <div className="text-4xl font-bold mb-2">
              {data.summary.totalPageViews.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm opacity-90">Total de Page Views</div>
          </CardContent>
        </Card>

        <Card style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})` }}>
          <CardContent className="pt-6 text-white">
            <div className="text-4xl font-bold mb-2">
              {data.summary.conversionRate.toFixed(2)}%
            </div>
            <div className="text-sm opacity-90">Taxa de Conversão</div>
          </CardContent>
        </Card>

        {data.summary.roi !== undefined && (
          <Card style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}>
            <CardContent className="pt-6 text-white">
              <div className="text-4xl font-bold mb-2">
                {data.summary.roi > 0 ? '+' : ''}{data.summary.roi.toFixed(1)}%
              </div>
              <div className="text-sm opacity-90">ROI</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico de Conversões */}
      {config.includeConversions && (
        <Card className="report-chart">
          <CardHeader>
            <CardTitle>📈 Conversões ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ModernAreaChart 
              data={data.dailyData} 
              colors={colors}
              gradient={gradient}
            />
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Page Views */}
      {config.includePageViews && (
        <Card className="report-chart">
          <CardHeader>
            <CardTitle>👁️ Page Views ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <SmoothLineChart 
              data={data.dailyData} 
              colors={colors}
            />
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Tipo */}
      {config.includeConversionTypes && data.conversionsByType && data.conversionsByType.length > 0 && (
        <Card className="report-chart">
          <CardHeader>
            <CardTitle>🎯 Conversões por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart 
              data={data.conversionsByType} 
              colors={colors}
            />
          </CardContent>
        </Card>
      )}

      {/* Top Páginas */}
      {config.includeTopPages && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top Páginas que Mais Convertem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Página</th>
                    <th className="text-right p-3 font-semibold">Conversões</th>
                    <th className="text-right p-3 font-semibold">Page Views</th>
                    <th className="text-right p-3 font-semibold">Taxa (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.slice(0, 10).map((page, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 max-w-xs truncate">{page.page}</td>
                      <td className="p-3 text-right">{page.conversions.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">{page.pageViews.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-semibold" style={{ color: colors.primary }}>
                        {page.conversionRate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Páginas com Baixa Performance */}
      {config.includeBottomPages && data.bottomPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">⚠️ Páginas com Baixa Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Página</th>
                    <th className="text-right p-3 font-semibold">Conversões</th>
                    <th className="text-right p-3 font-semibold">Page Views</th>
                    <th className="text-right p-3 font-semibold">Taxa (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bottomPages.slice(0, 10).map((page, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 max-w-xs truncate">{page.page}</td>
                      <td className="p-3 text-right">{page.conversions.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">{page.pageViews.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-semibold text-destructive">
                        {page.conversionRate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
