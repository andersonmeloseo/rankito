import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Zap, List, X, CheckCircle2, XCircle, AlertCircle, Calendar, Settings, Plus, Pencil, Trash2, Play, Pause } from "lucide-react";
import { useGSCScheduling } from "@/hooks/useGSCScheduling";
import { useGSCQuotaStatus } from "@/hooks/useGSCQuotaStatus";
import { useScheduleConfig, ScheduleConfig } from "@/hooks/useScheduleConfig";
import { ScheduleConfigDialog } from "./ScheduleConfigDialog";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface GSCSchedulingPanelProps {
  siteId: string;
}

export const GSCSchedulingPanel = ({ siteId }: GSCSchedulingPanelProps) => {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ScheduleConfig | null>(null);
  
  const {
    scheduledSubmissions,
    submissionHistory,
    queueStats,
    isLoadingScheduled,
    cancelScheduled,
  } = useGSCScheduling(siteId);

  const { quotaStatus, quotaExceeded } = useGSCQuotaStatus(siteId);
  const { configs, deleteConfig, toggleActiveStatus } = useScheduleConfig(siteId);

  const getFrequencyLabel = (freq?: string) => {
    const labels: Record<string, string> = {
      hourly: 'A cada hora',
      daily: 'Diariamente',
      weekly: 'Semanalmente',
      custom: 'Personalizado',
    };
    return labels[freq || 'daily'] || 'Não configurado';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      processing: { variant: "default", icon: Clock },
      completed: { variant: "secondary", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "outline", icon: X },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const handleEditSchedule = (config: ScheduleConfig) => {
    setEditingConfig(config);
    setConfigDialogOpen(true);
  };

  const handleNewSchedule = () => {
    setEditingConfig(null);
    setConfigDialogOpen(true);
  };

  const handleToggleActive = (configId: string, currentStatus: boolean) => {
    toggleActiveStatus.mutate({ configId, isActive: !currentStatus });
  };

  const handleDeleteSchedule = (configId: string) => {
    if (confirm('Tem certeza que deseja remover este agendamento?')) {
      deleteConfig.mutate(configId);
    }
  };

  const activeSchedulesCount = configs?.filter(c => c.is_active).length || 0;
  const totalDailyCapacity = (configs?.filter(c => c.is_active).reduce((sum, c) => sum + c.max_urls_per_run, 0) || 0);
  const nextSchedule = configs?.filter(c => c.is_active && c.next_run_at)
    .sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime())[0];

  return (
    <div className="space-y-6">
      <ScheduleConfigDialog 
        open={configDialogOpen} 
        onOpenChange={setConfigDialogOpen}
        siteId={siteId}
        editingConfig={editingConfig}
      />

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Agendamentos Ativos</p>
              <p className="text-2xl font-bold">{activeSchedulesCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total URLs/dia</p>
              <p className="text-2xl font-bold">{totalDailyCapacity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próxima Execução</p>
              <p className="text-lg font-semibold">
                {nextSchedule ? format(new Date(nextSchedule.next_run_at!), "dd/MM HH:mm", { locale: ptBR }) : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agendamentos Configurados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Agendamentos Configurados
              </CardTitle>
              <CardDescription>
                {configs?.length || 0} agendamento(s) cadastrado(s)
              </CardDescription>
            </div>
            <Button onClick={handleNewSchedule}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!configs || configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento configurado. Clique em "Novo Agendamento" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>URLs/exec</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.schedule_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getFrequencyLabel(config.frequency)}</Badge>
                    </TableCell>
                    <TableCell>{config.specific_time}</TableCell>
                    <TableCell>{config.max_urls_per_run}</TableCell>
                    <TableCell>
                      {config.next_run_at 
                        ? format(new Date(config.next_run_at), "dd/MM HH:mm", { locale: ptBR })
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? "Ativo" : "Pausado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(config.id!, config.is_active)}
                          title={config.is_active ? "Pausar" : "Ativar"}
                        >
                          {config.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSchedule(config)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSchedule(config.id!)}
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <List className="h-4 w-4 text-muted-foreground" />
                  URLs na Fila
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{queueStats?.queued || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Aguardando agendamento</p>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Capacidade Diária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{quotaStatus?.total_limit || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">URLs/dia</p>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Próximo Processamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {scheduledSubmissions && scheduledSubmissions.length > 0
                    ? format(new Date(scheduledSubmissions[0].scheduled_for), "dd/MM HH:mm", { locale: ptBR })
                    : "-"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">Horário agendado</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerta de Quota Excedida */}
          {quotaExceeded && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Quota diária excedida! Próximo reset em: 00:00 UTC
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Agendamentos Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendamentos Pendentes
          </CardTitle>
          <CardDescription>
            {scheduledSubmissions?.length || 0} submissões aguardando processamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingScheduled ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !scheduledSubmissions || scheduledSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento pendente
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>URLs</TableHead>
                  <TableHead>Integração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      {sub.submission_type === 'sitemap' ? (
                        <Badge variant="secondary">Sitemap</Badge>
                      ) : (
                        <Badge>URLs</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(sub.scheduled_for), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{sub.urls?.length || '-'}</TableCell>
                    <TableCell>
                      {sub.integration?.connection_name || 'Auto'}
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelScheduled.mutate([sub.id])}
                        disabled={sub.status !== 'pending' || cancelScheduled.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Envios */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
          <CardDescription>Últimos 100 envios de indexação</CardDescription>
        </CardHeader>
        <CardContent>
          {!submissionHistory || submissionHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico disponível
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>URLs Enviadas</TableHead>
                  <TableHead>Sucesso</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead>Integração</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionHistory.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      {format(new Date(sub.completed_at || sub.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.submission_type === 'sitemap' ? 'secondary' : 'default'}>
                        {sub.submission_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.urls_submitted || 0}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {sub.urls_successful || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {sub.urls_failed || 0}
                      </div>
                    </TableCell>
                    <TableCell>{sub.integration?.connection_name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};