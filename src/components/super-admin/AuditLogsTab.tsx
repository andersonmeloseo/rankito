import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionLabels: Record<string, { label: string; color: string }> = {
  user_created: { label: "Usuário Criado", color: "default" },
  user_approved: { label: "Cadastro Aprovado", color: "default" },
  user_rejected: { label: "Cadastro Rejeitado", color: "destructive" },
  user_blocked: { label: "Usuário Bloqueado", color: "destructive" },
  user_unblocked: { label: "Usuário Desbloqueado", color: "default" },
  user_deleted: { label: "Usuário Excluído", color: "destructive" },
  user_updated: { label: "Usuário Atualizado", color: "default" },
  email_updated: { label: "Email Atualizado", color: "default" },
  password_reset: { label: "Senha Resetada", color: "default" },
  plan_assigned: { label: "Plano Atribuído", color: "default" },
  plan_changed: { label: "Plano Alterado", color: "default" },
  bulk_plan_assigned: { label: "Planos Atribuídos em Lote", color: "default" },
};

export const AuditLogsTab = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  
  const { data: logs, isLoading, refetch } = useAuditLogs({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    action: actionFilter,
  });

  const getActionBadge = (action: string) => {
    const config = actionLabels[action] || { label: action, color: "secondary" };
    return (
      <Badge variant={config.color as any}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="shadow-card hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs de Auditoria</CardTitle>
            <CardDescription>
              Histórico completo de todas as ações administrativas
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tipo de Ação</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="user_created">Usuário Criado</SelectItem>
                <SelectItem value="user_approved">Cadastro Aprovado</SelectItem>
                <SelectItem value="user_rejected">Cadastro Rejeitado</SelectItem>
                <SelectItem value="user_blocked">Usuário Bloqueado</SelectItem>
                <SelectItem value="user_unblocked">Usuário Desbloqueado</SelectItem>
                <SelectItem value="user_deleted">Usuário Excluído</SelectItem>
                <SelectItem value="user_updated">Usuário Atualizado</SelectItem>
                <SelectItem value="email_updated">Email Atualizado</SelectItem>
                <SelectItem value="password_reset">Senha Resetada</SelectItem>
                <SelectItem value="plan_assigned">Plano Atribuído</SelectItem>
                <SelectItem value="plan_changed">Plano Alterado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(startDate || endDate || actionFilter !== "all") && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setActionFilter("all");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum log encontrado com os filtros aplicados
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="h-12">Data/Hora</TableHead>
                  <TableHead className="h-12">Admin</TableHead>
                  <TableHead className="h-12">Ação</TableHead>
                  <TableHead className="h-12">Usuário Alvo</TableHead>
                  <TableHead className="h-12">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id} className="h-16">
                    <TableCell className="p-4 font-mono text-xs">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="p-4">
                      <div>
                        <div className="font-medium">{log.admin?.full_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{log.admin?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="p-4">
                      {log.target ? (
                        <div>
                          <div className="font-medium">{log.target.full_name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{log.target.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div className="text-xs space-y-1">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span>{" "}
                              <span className="text-muted-foreground">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Contador de logs */}
        {logs && logs.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
