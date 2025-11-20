import { useState } from "react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useSuperAdmins } from "@/hooks/useSuperAdmins";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Filter, Loader2, RefreshCw, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportAuditLogsToExcel, exportAuditLogsToCSV } from "@/utils/exportAuditLogs";
import { AuditLogsAnalytics } from "./AuditLogsAnalytics";

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
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  const { data: admins } = useSuperAdmins();
  const { data, isLoading, refetch } = useAuditLogs({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    action: actionFilter,
    adminUserId: adminFilter !== "all" ? adminFilter : undefined,
    page: currentPage,
    pageSize: pageSize,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 0;
  const totalCount = data?.totalCount || 0;

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
          <div className="flex gap-2">
            <Button
              variant={showAnalytics ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showAnalytics ? "Ocultar" : "Mostrar"} Analytics
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportAuditLogsToExcel(logs, { startDate, endDate, action: actionFilter })}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAuditLogsToCSV(logs)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
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
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showAnalytics && <AuditLogsAnalytics logs={logs} />}

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
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
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Administrador</label>
            <Select value={adminFilter} onValueChange={(val) => {
              setAdminFilter(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os admins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os admins</SelectItem>
                {admins?.map(admin => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.full_name} ({admin.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tipo de Ação</label>
            <Select value={actionFilter} onValueChange={(val) => {
              setActionFilter(val);
              setCurrentPage(1);
            }}>
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

          {(startDate || endDate || actionFilter !== "all" || adminFilter !== "all") && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setActionFilter("all");
                  setAdminFilter("all");
                  setCurrentPage(1);
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
          <>
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

            {/* Paginação */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Mostrando {logs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} 
                  - {Math.min(currentPage * pageSize, totalCount)} de {totalCount} registros
                </span>
                
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                    <SelectItem value="100">100 por página</SelectItem>
                    <SelectItem value="200">200 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-muted-foreground px-2">...</span>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
