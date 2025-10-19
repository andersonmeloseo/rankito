import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MetricCard } from "./MetricCard";
import { TrendingUp, Eye, Target } from "lucide-react";
import { ReportData } from "@/hooks/useReportData";
import { ReportStyle } from "./ReportStyleConfigurator";

interface ReportPreviewProps {
  reportName: string;
  reportData: ReportData;
  style: ReportStyle;
  includeConversions: boolean;
  includePageViews: boolean;
  includeTopPages: boolean;
  includeReferrers: boolean;
}

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const ReportPreview = ({
  reportName,
  reportData,
  style,
  includeConversions,
  includePageViews,
  includeTopPages,
  includeReferrers
}: ReportPreviewProps) => {
  return (
    <Card id="report-preview" className="mt-6">
      <CardHeader>
        <CardTitle className="text-3xl">{reportName}</CardTitle>
        <p className="text-muted-foreground">
          {reportData.period.start} - {reportData.period.end}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Cards de Métricas */}
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
        </div>

        {/* Gráfico de Linha - Conversões ao Longo do Tempo */}
        {includeConversions && reportData.conversionsTimeline.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">📈 Conversões ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.conversionsTimeline}>
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={style.customColors.primary}
                  strokeWidth={3}
                  dot={{ fill: style.customColors.primary, r: 4 }}
                  name="Conversões"
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
