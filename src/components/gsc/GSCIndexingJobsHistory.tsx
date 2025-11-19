import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGSCIndexingJobs } from '@/hooks/useGSCIndexingJobs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface GSCIndexingJobsHistoryProps {
  siteId: string;
}

export const GSCIndexingJobsHistory = ({ siteId }: GSCIndexingJobsHistoryProps) => {
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { jobs, statistics, isLoading } = useGSCIndexingJobs(siteId, {
    jobType: jobTypeFilter,
    status: statusFilter,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Falhou</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700">Executando</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getJobTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      discovery: 'Descoberta',
      sitemap: 'Sitemap',
      instant_index: 'Indexação Instantânea',
      health_check: 'Verificação de Saúde',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total de Jobs</p>
              <p className="text-2xl font-bold">{statistics.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Falhados</p>
              <p className="text-2xl font-bold text-red-600">{statistics.failed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">URLs Processadas</p>
              <p className="text-2xl font-bold">{statistics.totalUrlsProcessed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">URLs Falhadas</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.totalUrlsFailed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Histórico de Jobs</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="discovery">Descoberta</SelectItem>
                  <SelectItem value="sitemap">Sitemap</SelectItem>
                  <SelectItem value="instant_index">Indexação</SelectItem>
                  <SelectItem value="health_check">Saúde</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="running">Executando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">URLs Processadas</TableHead>
                  <TableHead className="text-right">Sucesso</TableHead>
                  <TableHead className="text-right">Falhas</TableHead>
                  <TableHead className="text-center">Criado Em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs && jobs.length > 0 ? (
                  jobs.map((job) => (
                    <TableRow key={job.id} className="h-16">
                      <TableCell>{getJobTypeBadge(job.job_type)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(job.status)}
                          {getStatusBadge(job.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{job.urls_processed || 0}</TableCell>
                      <TableCell className="text-right text-green-600">{job.urls_successful || 0}</TableCell>
                      <TableCell className="text-right text-red-600">{job.urls_failed || 0}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {format(new Date(job.created_at!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum job executado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
