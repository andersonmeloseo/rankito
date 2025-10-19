import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { MetricCard } from "./MetricCard";
import { ComparisonMetricCard } from "./ComparisonMetricCard";
import { ComparisonInsights } from "./ComparisonInsights";
import { ConversionHeatmapChart } from "@/components/analytics/ConversionHeatmapChart";
import { TrendingUp, Eye, Target, DollarSign } from "lucide-react";
import { ReportData } from "@/hooks/useReportData";
import { ReportStyle } from "./ReportStyleConfigurator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReportTranslation, formatCurrency, Currency, ReportLocale } from "@/i18n/reportTranslations";

interface ReportPreviewProps {
  reportName: string;
  reportData: ReportData;
  style: ReportStyle;
  includeConversions: boolean;
  includePageViews: boolean;
  includeTopPages: boolean;
  includeReferrers: boolean;
  financialConfig?: {
    costPerConversion: number;
    currency: Currency;
    locale: ReportLocale;
  };
}

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const ReportPreview = ({
  reportName,
  reportData,
  style,
  includeConversions,
  includePageViews,
  includeTopPages,
  includeReferrers,
  financialConfig
}: ReportPreviewProps) => {
  const { t } = useReportTranslation(financialConfig?.locale || 'pt-BR');
  return (
    <Card id="report-preview" className="mt-6">
      <CardHeader>
        <CardTitle className="text-3xl">{reportName}</CardTitle>
        <p className="text-muted-foreground">
          {reportData.period.start} - {reportData.period.end}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Insights de Comparação */}
        {reportData.comparison && <ComparisonInsights reportData={reportData} />}

        {/* Cards de Métricas */}
        {reportData.comparison ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {includeConversions && (
              <ComparisonMetricCard
                title="Total de Conversões"
                currentValue={reportData.summary.totalConversions}
                previousValue={reportData.previousSummary?.totalConversions}
                changePercentage={reportData.comparison.conversionsChange}
                icon={Target}
                color={style.customColors.primary}
              />
            )}
            {includePageViews && (
              <ComparisonMetricCard
                title="Total de Page Views"
                currentValue={reportData.summary.totalPageViews.toLocaleString('pt-BR')}
                previousValue={reportData.previousSummary?.totalPageViews.toLocaleString('pt-BR')}
                changePercentage={reportData.comparison.pageViewsChange}
                icon={Eye}
                color={style.customColors.secondary}
              />
            )}
            <ComparisonMetricCard
              title="Taxa de Conversão"
              currentValue={`${reportData.summary.conversionRate.toFixed(2)}%`}
              previousValue={reportData.previousSummary ? `${reportData.previousSummary.conversionRate.toFixed(2)}%` : undefined}
              changePercentage={reportData.comparison.conversionRateChange}
              icon={TrendingUp}
              color={style.customColors.accent}
            />
            {reportData.financial && financialConfig && (
              <ComparisonMetricCard
                title={t('totalValueGenerated')}
                currentValue={formatCurrency(
                  reportData.financial.totalValue,
                  financialConfig.currency,
                  financialConfig.locale
                )}
                previousValue={reportData.financial.previousTotalValue 
                  ? formatCurrency(
                      reportData.financial.previousTotalValue,
                      financialConfig.currency,
                      financialConfig.locale
                    )
                  : undefined}
                changePercentage={reportData.financial.valueChange}
                icon={DollarSign}
                color={style.customColors.accent}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {includeConversions && (
              <MetricCard
                title="Total de Conversões"
                value={reportData.summary.totalConversions}
                icon={Target}
                color={style.customColors.primary}
              />
            )}
            {includePageViews && (
              <MetricCard
                title="Total de Page Views"
                value={reportData.summary.totalPageViews.toLocaleString('pt-BR')}
                icon={Eye}
                color={style.customColors.secondary}
              />
            )}
            <MetricCard
              title="Taxa de Conversão"
              value={`${reportData.summary.conversionRate.toFixed(2)}%`}
              icon={TrendingUp}
              color={style.customColors.accent}
            />
            {reportData.financial && financialConfig && (
              <MetricCard
                title={t('totalValueGenerated')}
                value={formatCurrency(
                  reportData.financial.totalValue,
                  financialConfig.currency,
                  financialConfig.locale
                )}
                icon={DollarSign}
                color={style.customColors.accent}
              />
            )}
          </div>
        )}

        {/* Insight de Economia */}
        {reportData.financial && financialConfig && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <AlertDescription className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200">
                {t('savingsMessage', {
                  conversions: reportData.summary.totalConversions,
                  value: formatCurrency(
                    reportData.financial.totalValue,
                    financialConfig.currency,
                    financialConfig.locale
                  ),
                  costPer: formatCurrency(
                    financialConfig.costPerConversion,
                    financialConfig.currency,
                    financialConfig.locale
                  )
                })}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Gráfico Combo - Conversões vs Page Views */}
        {includeConversions && includePageViews && reportData.pageViewsTimeline.length > 0 && (
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                📊 Conversões vs Page Views
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Análise de assertividade: correlação entre tráfego e conversões
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={reportData.pageViewsTimeline}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={style.customColors.secondary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={style.customColors.secondary} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    yAxisId="left"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Conversões', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Page Views', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="views"
                    fill="url(#viewsGradient)"
                    stroke={style.customColors.secondary}
                    strokeWidth={2}
                    fillOpacity={1}
                    name="Page Views"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="conversions"
                    stroke={style.customColors.primary}
                    strokeWidth={3}
                    dot={{ fill: style.customColors.primary, r: 5, strokeWidth: 2, stroke: '#fff' }}
                    name="Conversões"
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Mapa de Calor de Conversões */}
        {includeConversions && reportData.conversionHeatmap && Object.keys(reportData.conversionHeatmap).length > 0 && (
          <ConversionHeatmapChart
            data={reportData.conversionHeatmap}
            isLoading={false}
          />
        )}

        {/* Gráfico de Comparação de Períodos (se ativado) */}
        {reportData.comparison && reportData.previousConversionsTimeline && includeConversions && (
          <div>
            <h3 className="text-lg font-semibold mb-4">📊 Comparação: Período Atual vs Anterior</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  data={reportData.conversionsTimeline}
                  dataKey="count"
                  stroke={style.customColors.primary}
                  strokeWidth={3}
                  dot={{ fill: style.customColors.primary, r: 4 }}
                  name="Período Atual"
                />
                <Line
                  type="monotone"
                  data={reportData.previousConversionsTimeline}
                  dataKey="count"
                  stroke={style.customColors.secondary}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: style.customColors.secondary, r: 3 }}
                  name="Período Anterior"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela de Top Páginas */}
        {includeTopPages && reportData.topPages.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🏆 Top 10 Páginas que Mais Convertem</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Página</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                    <TableHead className="text-right">Page Views</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topPages.map((page, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {page.page}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {page.conversions}
                      </TableCell>
                      <TableCell className="text-right">
                        {page.pageViews.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold" style={{ color: style.customColors.primary }}>
                          {page.conversionRate.toFixed(2)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Gráfico de Pizza - Distribuição de Tipos de Conversão */}
        {includeConversions && reportData.conversionTypes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🎯 Distribuição de Tipos de Conversão</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.conversionTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                >
                  {reportData.conversionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela de Top Referrers */}
        {includeReferrers && reportData.referrers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🔗 Top Referrers</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Conversões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.referrers.map((ref, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{ref.referrer}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {ref.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
