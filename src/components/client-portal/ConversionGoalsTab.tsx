import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, Currency, ReportLocale } from "@/i18n/reportTranslations";

interface GoalMetric {
  goalId: string;
  goalName: string;
  goalType: string;
  conversionValue: number;
  conversions: number;
  totalValue: number;
  percentage: number;
}

interface ConversionGoalsTabProps {
  goalMetrics: GoalMetric[];
  currency?: Currency;
  locale?: ReportLocale;
}

const GOAL_COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

const getGoalTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'cta_match': 'CTA Match',
    'page_destination': 'Página Destino',
    'url_pattern': 'Padrão URL',
    'combined': 'Combinado'
  };
  return labels[type] || type;
};

export const ConversionGoalsTab = ({ 
  goalMetrics, 
  currency = 'BRL', 
  locale = 'pt-BR' 
}: ConversionGoalsTabProps) => {
  const totalValue = goalMetrics.reduce((sum, m) => sum + m.totalValue, 0);
  const totalConversions = goalMetrics.reduce((sum, m) => sum + m.conversions, 0);
  const avgValuePerConversion = totalConversions > 0 ? totalValue / totalConversions : 0;

  // Prepare pie chart data
  const pieData = goalMetrics.map((metric, index) => ({
    name: metric.goalName,
    value: metric.conversions,
    fill: GOAL_COLORS[index % GOAL_COLORS.length]
  }));

  if (goalMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma Meta Configurada</h3>
          <p className="text-muted-foreground">
            As metas de conversão ainda não foram configuradas para este projeto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Metas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{goalMetrics.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Conversões em Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalConversions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalValue, currency, locale)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Valor Médio/Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(avgValuePerConversion, currency, locale)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance por Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Valor/Conv.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalMetrics.map((metric, index) => (
                  <TableRow key={metric.goalId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: GOAL_COLORS[index % GOAL_COLORS.length] }}
                        />
                        {metric.goalName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getGoalTypeLabel(metric.goalType)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {metric.conversions}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(metric.conversionValue, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(metric.totalValue, currency, locale)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {metric.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Conversões']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
