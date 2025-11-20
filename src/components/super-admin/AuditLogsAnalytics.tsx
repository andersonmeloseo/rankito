import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Activity, TrendingUp, Users, Calendar } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogsAnalyticsProps {
  logs: any[];
}

const actionLabels: Record<string, string> = {
  user_created: "Usuário Criado",
  user_approved: "Cadastro Aprovado",
  user_rejected: "Cadastro Rejeitado",
  user_blocked: "Usuário Bloqueado",
  user_unblocked: "Usuário Desbloqueado",
  user_deleted: "Usuário Excluído",
  user_updated: "Usuário Atualizado",
  email_updated: "Email Atualizado",
  password_reset: "Senha Resetada",
  plan_assigned: "Plano Atribuído",
  plan_changed: "Plano Alterado",
  bulk_plan_assigned: "Planos Atribuídos em Lote",
};

export const AuditLogsAnalytics = ({ logs }: AuditLogsAnalyticsProps) => {
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const activityByDay = last30Days.map(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count = logs.filter(log => 
      format(new Date(log.created_at), "yyyy-MM-dd") === dayStr
    ).length;
    
    return {
      date: format(day, "dd/MM", { locale: ptBR }),
      count,
    };
  });

  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([action, count]) => ({
      action: actionLabels[action] || action,
      count,
    }));

  const adminCounts = logs.reduce((acc, log) => {
    const adminName = log.admin?.full_name || "N/A";
    acc[adminName] = (acc[adminName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAdmins = Object.entries(adminCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([admin, count]) => ({
      admin,
      count,
    }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Ações</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Últimas 24h</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => 
                    new Date(l.created_at) > subDays(new Date(), 1)
                  ).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins Ativos</p>
                <p className="text-2xl font-bold">{Object.keys(adminCounts).length}</p>
              </div>
              <Users className="h-8 w-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Diária</p>
                <p className="text-2xl font-bold">
                  {Math.round(logs.length / 30)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Administrativa (Últimos 30 Dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityByDay}>
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
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Ações"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Mais Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topActions} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="action" type="category" width={150} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admins Mais Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topAdmins}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.admin}: ${entry.count}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="count"
                >
                  {topAdmins.map((entry, index) => (
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
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
