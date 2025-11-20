import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRetentionAnalytics } from "@/hooks/useRetentionAnalytics";
import { Users, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export const RetentionAnalytics = () => {
  const { cohortData, metrics, planRetention, isLoading } = useRetentionAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare cohort heatmap data
  const cohortHeatmapData = cohortData?.map(cohort => ({
    month: cohort.cohort_month,
    users: cohort.users_count,
    ...cohort.retention_rates,
  })) || [];

  // Prepare plan retention chart data
  const planRetentionData = planRetention?.map(p => ({
    name: p.plan,
    retention: p.retention_rate,
    active: p.active_users,
    total: p.total_users,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retenção Semanal
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.weekly_retention.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários ativos nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retenção Mensal
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.monthly_retention.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários ativos nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Churn
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.churn_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários inativos há mais de 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Dias Ativos
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.avg_days_active.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dias desde o cadastro até última atividade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Análise de Cohorts - Retenção por Mês de Cadastro</CardTitle>
          <p className="text-sm text-muted-foreground">
            Taxa de retenção dos usuários ao longo do tempo desde o cadastro
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cohortHeatmapData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                label={{ value: 'Retenção (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="month_0" 
                stroke="#10b981" 
                name="Mês 0"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="month_1" 
                stroke="#3b82f6" 
                name="Mês 1"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="month_2" 
                stroke="#8b5cf6" 
                name="Mês 2"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="month_3" 
                stroke="#f59e0b" 
                name="Mês 3"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Retention */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Retenção por Plano de Assinatura</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparação de retenção entre diferentes planos
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={planRetentionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="name" 
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                label={{ value: 'Retenção (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'retention') return [`${value.toFixed(1)}%`, 'Taxa de Retenção'];
                  return [value, name];
                }}
              />
              <Bar dataKey="retention" radius={[8, 8, 0, 0]}>
                {planRetentionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Plan Details Table */}
          <div className="mt-6 space-y-2">
            {planRetentionData.map((plan, index) => (
              <div 
                key={plan.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {plan.retention.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plan.active}/{plan.total} ativos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
