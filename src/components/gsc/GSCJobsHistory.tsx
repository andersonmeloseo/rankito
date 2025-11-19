import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useGSCIndexingJobs } from "@/hooks/useGSCIndexingJobs";
import { CheckCircle, XCircle, Clock, Play, Search, Calendar, Zap } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GSCJobsHistoryProps {
  siteId: string;
}

export function GSCJobsHistory({ siteId }: GSCJobsHistoryProps) {
  const { data: jobs, isLoading } = useGSCIndexingJobs({ siteId, limit: 20 });

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { variant: "default" as const, icon: CheckCircle, label: "Concluído", color: "text-green-600" },
      failed: { variant: "destructive" as const, icon: XCircle, label: "Falhou", color: "text-red-600" },
      running: { variant: "secondary" as const, icon: Play, label: "Executando", color: "text-blue-600" },
      queued: { variant: "outline" as const, icon: Clock, label: "Na Fila", color: "text-gray-600" },
    };

    const config = variants[status as keyof typeof variants] || variants.queued;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getJobTypeIcon = (type: string) => {
    const icons = {
      manual: Zap,
      scheduled: Calendar,
      discovery: Search,
    };
    return icons[type as keyof typeof icons] || Clock;
  };

  const getJobTypeLabel = (type: string) => {
    const labels = {
      manual: 'Manual',
      scheduled: 'Agendado',
      discovery: 'Descoberta',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Jobs</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {jobs?.length || 0} jobs registrados
        </p>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>Nenhum job executado ainda</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URLs</TableHead>
                  <TableHead>Sucesso</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead>Iniciado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const TypeIcon = getJobTypeIcon(job.job_type);
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getJobTypeLabel(job.job_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(job.status)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {job.urls_processed}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {job.urls_successful}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {job.urls_failed}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {job.started_at ? (
                          <div className="space-y-1">
                            <div>
                              {format(new Date(job.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            <div className="text-xs">
                              {formatDistanceToNow(new Date(job.started_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
