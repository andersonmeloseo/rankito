import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAutomationRules, useAutomationExecutionLogs, useAutomationStats, AutomationRule } from "@/hooks/useAutomationRules";
import { AutomationRuleCard } from "./AutomationRuleCard";
import { CreateAutomationRuleDialog } from "./CreateAutomationRuleDialog";
import { Plus, Bot, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AdminAutomationsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const { data: rules, isLoading: rulesLoading } = useAutomationRules();
  const { data: executionLogs, isLoading: logsLoading } = useAutomationExecutionLogs();
  const { data: stats } = useAutomationStats();

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case "failed":
        return <Badge variant="destructive">Falha</Badge>;
      case "skipped":
        return <Badge variant="outline">Pulado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_rules || 0}</div>
            <p className="text-xs text-muted-foreground">automações configuradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Execuções 24h</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.executions_24h || 0}</div>
            <p className="text-xs text-muted-foreground">ações executadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.success_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">execuções bem-sucedidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Economizado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.time_saved_hours || 0}h</div>
            <p className="text-xs text-muted-foreground">nas últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciamento de Regras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regras de Automação</CardTitle>
              <CardDescription>Configure e gerencie automações administrativas</CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando regras...</div>
          ) : rules && rules.length > 0 ? (
            <div className="space-y-4">
              {rules.map((rule) => (
                <AutomationRuleCard
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditRule}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma regra de automação configurada ainda.
              </p>
              <Button onClick={handleCreateNew} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Regra
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Execuções</CardTitle>
          <CardDescription>Últimas 100 execuções de automações</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
          ) : executionLogs && executionLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{log.admin_automation_rules?.rule_name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.admin_automation_rules?.rule_type || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.profiles?.email || "Sistema"}</TableCell>
                      <TableCell>{getStatusBadge(log.execution_status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {log.error_message || JSON.stringify(log.execution_details).substring(0, 50)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma execução registrada ainda.
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAutomationRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingRule={editingRule}
      />
    </div>
  );
}
