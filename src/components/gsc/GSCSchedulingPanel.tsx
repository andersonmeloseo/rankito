import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Zap, List, RefreshCw, X, CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react";
import { useGSCScheduling } from "@/hooks/useGSCScheduling";
import { useGSCQuotaStatus } from "@/hooks/useGSCQuotaStatus";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface GSCSchedulingPanelProps {
  siteId: string;
}

export const GSCSchedulingPanel = ({ siteId }: GSCSchedulingPanelProps) => {
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(true);
  
  const {
    scheduledSubmissions,
    submissionHistory,
    queueStats,
    isLoadingScheduled,
    cancelScheduled,
    rescheduleNow,
  } = useGSCScheduling(siteId);

  const { quotaStatus, quotaExceeded, percentageUsed } = useGSCQuotaStatus(siteId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      processing: { variant: "default", icon: RefreshCw },
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

  const nextProcessingTime = scheduledSubmissions && scheduledSubmissions.length > 0
    ? format(new Date(scheduledSubmissions[0].scheduled_for), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : "-";

  return (
    <div className="space-y-6">
      {/* Agendamento Inteligente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Agendamento Inteligente
          </CardTitle>
          <CardDescription>
            Distribua URLs automaticamente ao longo de 24h respeitando quota diária
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="auto-schedule" className="text-sm font-medium">
                Ativar agendamento automático
              </Label>
              <p className="text-sm text-muted-foreground">
                URLs descobertas serão distribuídas automaticamente
              </p>
            </div>
            <Switch
              id="auto-schedule"
              checked={autoScheduleEnabled}
              onCheckedChange={setAutoScheduleEnabled}
            />
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-lg font-semibold">{nextProcessingTime}</p>
                <p className="text-xs text-muted-foreground mt-1">Horário agendado</p>
              </CardContent>
            </Card>
          </div>

          {/* Botão Reagendar */}
          <Button
            onClick={() => rescheduleNow.mutate()}
            disabled={rescheduleNow.isPending}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${rescheduleNow.isPending ? 'animate-spin' : ''}`} />
            Reagendar Agora
          </Button>

          {/* Alerta de Quota Excedida */}
          {quotaExceeded && (
            <Alert variant="destructive">
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
