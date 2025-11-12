import { useState } from "react";
import { useGSCSchedules, type GSCSchedule } from "@/hooks/useGSCSchedules";
import { useGSCIntegrations } from "@/hooks/useGSCIntegrations";
import { useGSCSitemaps } from "@/hooks/useGSCSitemaps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Play, Pause, Edit, Trash2, Calendar, History, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface GSCSitemapSchedulerProps {
  siteId: string;
  userId: string;
}

export function GSCSitemapScheduler({ siteId, userId }: GSCSitemapSchedulerProps) {
  const { schedules, executionLogs, isLoading, createSchedule, updateSchedule, deleteSchedule, executeNow, toggleActive } = useGSCSchedules({ siteId });
  const { integrations } = useGSCIntegrations(siteId, userId);
  const { sitemaps } = useGSCSitemaps({ siteId });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<GSCSchedule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    schedule_name: '',
    schedule_type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    interval_hours: 24,
    integration_id: null as string | null,
    sitemap_paths: [] as string[],
    selectAllSitemaps: true,
  });

  

  const handleCreateSchedule = () => {
    const nextRun = calculateNextRun(formData.schedule_type, formData.interval_hours);
    
    createSchedule.mutate({
      site_id: siteId,
      integration_id: formData.integration_id || null,
      schedule_name: formData.schedule_name,
      schedule_type: formData.schedule_type,
      interval_hours: formData.schedule_type === 'custom' ? formData.interval_hours : null,
      sitemap_paths: formData.selectAllSitemaps ? null : formData.sitemap_paths,
      is_active: true,
      last_run_at: null,
      next_run_at: nextRun,
    });
    
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdateSchedule = () => {
    if (!editingSchedule) return;
    
    const nextRun = calculateNextRun(formData.schedule_type, formData.interval_hours);
    
    updateSchedule.mutate({
      id: editingSchedule.id,
      schedule_name: formData.schedule_name,
      schedule_type: formData.schedule_type,
      interval_hours: formData.schedule_type === 'custom' ? formData.interval_hours : null,
      integration_id: formData.integration_id || null,
      sitemap_paths: formData.selectAllSitemaps ? null : formData.sitemap_paths,
      next_run_at: nextRun,
    });
    
    setIsEditDialogOpen(false);
    setEditingSchedule(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      schedule_type: 'daily',
      interval_hours: 24,
      integration_id: null,
      sitemap_paths: [],
      selectAllSitemaps: true,
    });
  };

  const openEditDialog = (schedule: GSCSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      schedule_name: schedule.schedule_name,
      schedule_type: schedule.schedule_type,
      interval_hours: schedule.interval_hours || 24,
      integration_id: schedule.integration_id || null,
      sitemap_paths: schedule.sitemap_paths || [],
      selectAllSitemaps: !schedule.sitemap_paths || schedule.sitemap_paths.length === 0,
    });
    setIsEditDialogOpen(true);
  };

  const calculateNextRun = (type: string, hours: number) => {
    const now = new Date();
    switch (type) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'custom':
        now.setHours(now.getHours() + hours);
        break;
    }
    return now.toISOString();
  };

  const getScheduleTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      custom: 'Personalizado',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (schedule: GSCSchedule) => {
    if (!schedule.is_active) {
      return <Badge variant="secondary">Pausado</Badge>;
    }
    const nextRun = new Date(schedule.next_run_at);
    const now = new Date();
    if (nextRun <= now) {
      return <Badge variant="default" className="bg-green-500">Próximo</Badge>;
    }
    return <Badge variant="outline">Ativo</Badge>;
  };

  if (isLoading) {
    return <div>Carregando agendamentos...</div>;
  }

  const scheduleForm = (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="schedule_name">Nome do Agendamento *</Label>
          <Input
            id="schedule_name"
            placeholder="Ex: Envio Diário de Sitemaps"
            value={formData.schedule_name}
            onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="schedule_type">Tipo de Intervalo *</Label>
          <Select
            value={formData.schedule_type}
            onValueChange={(value) => setFormData({ ...formData, schedule_type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário (a cada 24 horas)</SelectItem>
              <SelectItem value="weekly">Semanal (a cada 7 dias)</SelectItem>
              <SelectItem value="monthly">Mensal (a cada 30 dias)</SelectItem>
              <SelectItem value="custom">Personalizado (definir horas)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.schedule_type === 'custom' && (
          <div>
            <Label htmlFor="interval_hours">Intervalo em Horas *</Label>
            <Input
              id="interval_hours"
              type="number"
              min="1"
              value={formData.interval_hours}
              onChange={(e) => setFormData({ ...formData, interval_hours: parseInt(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Sitemaps serão enviados a cada {formData.interval_hours} horas
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="integration">Modo de Distribuição *</Label>
          <Select
            value={formData.integration_id || 'auto'}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              integration_id: value === 'auto' ? null : value 
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar modo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                🔄 Automático (usar todas as {integrations?.filter(i => i.is_active).length || 0} integrações ativas)
              </SelectItem>
              <Separator className="my-2" />
              {integrations?.map((integration) => (
                <SelectItem key={integration.id} value={integration.id}>
                  {integration.connection_name}
                  {!integration.is_active && " (Inativa)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(!formData.integration_id || formData.integration_id === 'auto') && (
            <p className="text-xs text-muted-foreground mt-1">
              ℹ️ Os sitemaps serão distribuídos automaticamente entre todas as integrações ativas
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select_all"
              checked={formData.selectAllSitemaps}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, selectAllSitemaps: checked as boolean, sitemap_paths: [] })
              }
            />
            <Label htmlFor="select_all">Enviar todos os sitemaps</Label>
          </div>

          {!formData.selectAllSitemaps && sitemaps && sitemaps.length > 0 && (
            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Selecione os sitemaps:</p>
              {sitemaps.map((sitemap) => (
                <div key={sitemap.sitemap_url} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={sitemap.sitemap_url}
                    checked={formData.sitemap_paths.includes(sitemap.sitemap_url)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ 
                          ...formData, 
                          sitemap_paths: [...formData.sitemap_paths, sitemap.sitemap_url] 
                        });
                      } else {
                        setFormData({
                          ...formData,
                          sitemap_paths: formData.sitemap_paths.filter(p => p !== sitemap.sitemap_url)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={sitemap.sitemap_url} className="text-sm font-normal cursor-pointer">
                    {sitemap.sitemap_url}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agendamentos Automáticos</h2>
          <p className="text-muted-foreground mt-1">
            Configure envios automáticos de sitemaps ao Google Search Console
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Agendamento Automático</DialogTitle>
              <DialogDescription>
                Configure o envio automático de sitemaps ao Google Search Console
              </DialogDescription>
            </DialogHeader>
            {scheduleForm}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSchedule}
                disabled={!formData.schedule_name || createSchedule.isPending}
              >
                Criar Agendamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Agendamentos */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento configurado</p>
            <p className="text-sm mt-2">Crie seu primeiro agendamento automático</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{schedule.schedule_name}</CardTitle>
                      {getStatusBadge(schedule)}
                      {schedule.integration_id ? (
                        <Badge variant="outline" className="text-xs">
                          Integração específica
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          🔄 Distribuição automática
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getScheduleTypeLabel(schedule.schedule_type)}
                        {schedule.schedule_type === 'custom' && ` (${schedule.interval_hours}h)`}
                      </span>
                      {schedule.sitemap_paths && schedule.sitemap_paths.length > 0 && (
                        <span>• {schedule.sitemap_paths.length} sitemaps selecionados</span>
                      )}
                      {(!schedule.sitemap_paths || schedule.sitemap_paths.length === 0) && (
                        <span>• Todos os sitemaps</span>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeNow.mutate(schedule.id)}
                      disabled={executeNow.isPending}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive.mutate({ id: schedule.id, is_active: !schedule.is_active })}
                    >
                      {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O histórico de execuções também será removido.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSchedule.mutate(schedule.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Última Execução</p>
                    <p className="font-medium">
                      {schedule.last_run_at
                        ? format(new Date(schedule.last_run_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Nunca executado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Próxima Execução</p>
                    <p className="font-medium">
                      {format(new Date(schedule.next_run_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Atualize as configurações do agendamento automático
            </DialogDescription>
          </DialogHeader>
          {scheduleForm}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSchedule}
              disabled={!formData.schedule_name || updateSchedule.isPending}
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Histórico de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Execuções
          </CardTitle>
          <CardDescription>
            Últimas 50 execuções automáticas e manuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {executionLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma execução registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executionLogs.map((log) => {
                const schedule = schedules.find(s => s.id === log.schedule_id);
                return (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{schedule?.schedule_name || 'Agendamento removido'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.executed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge
                        variant={log.status === 'success' ? 'default' : log.status === 'partial_success' ? 'secondary' : 'destructive'}
                      >
                        {log.status === 'success' ? 'Sucesso' : log.status === 'partial_success' ? 'Parcial' : 'Erro'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground">Tentados</p>
                        <p className="font-medium">{log.sitemaps_attempted.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sucesso</p>
                        <p className="font-medium text-green-600">{log.sitemaps_succeeded?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Falhas</p>
                        <p className="font-medium text-red-600">{log.sitemaps_failed?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tempo</p>
                        <p className="font-medium">{(log.execution_duration_ms / 1000).toFixed(2)}s</p>
                      </div>
                    </div>

                    {log.error_message && (
                      <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm">
                        {log.error_message}
                      </div>
                    )}

                    {log.integration_name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Integração: {log.integration_name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
