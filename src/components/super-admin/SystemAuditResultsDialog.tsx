import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Activity, Database, Users, DollarSign, Zap, AlertTriangle, CheckCircle2, Info, FileText } from "lucide-react";
import type { AuditReport, AuditIssue } from "@/hooks/useRunSystemAudit";

interface SystemAuditResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: AuditReport | null;
}

export const SystemAuditResultsDialog = ({ open, onOpenChange, report }: SystemAuditResultsDialogProps) => {
  if (!report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'default'
    };
    return variants[severity] || 'default';
  };

  const renderIssuesTable = (issues: AuditIssue[]) => {
    if (issues.length === 0) {
      return (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Nenhum problema detectado nesta categoria</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-3">
        {issues.map((issue, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{issue.title}</h4>
                    <Badge variant={getSeverityBadge(issue.severity)}>
                      {issue.severity === 'critical' ? 'Crítico' : 
                       issue.severity === 'warning' ? 'Aviso' : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                  {issue.recommendation && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      💡 {issue.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Relatório de Auditoria do Sistema
              </DialogTitle>
              <DialogDescription>
                Executado em {new Date(report.timestamp).toLocaleString('pt-BR')} 
                {' '}• Tempo: {report.execution_time_ms}ms
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(report.overall_status)}>
              {report.overall_status === 'healthy' ? '✅ Saudável' : 
               report.overall_status === 'warning' ? '⚠️ Avisos' : '🔴 Crítico'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.total_issues}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Críticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Avisos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{report.summary.warning}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{report.summary.info}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Recomendações:</strong>
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="text-sm">{rec}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Categories Tabs */}
        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="system_health" className="gap-2">
              <Activity className="h-4 w-4" />
              Saúde
            </TabsTrigger>
            <TabsTrigger value="data_integrity" className="gap-2">
              <Database className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Zap className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Auditoria de Segurança</h3>
              <Badge className={getStatusColor(report.categories.security.status)}>
                {report.categories.security.status}
              </Badge>
            </div>
            {renderIssuesTable(report.categories.security.issues)}
          </TabsContent>

          <TabsContent value="system_health" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Saúde do Sistema</h3>
              <div className="flex items-center gap-2">
                {report.categories.system_health.score !== undefined && (
                  <Badge variant="outline">Score: {report.categories.system_health.score}/100</Badge>
                )}
                <Badge className={getStatusColor(report.categories.system_health.status)}>
                  {report.categories.system_health.status}
                </Badge>
              </div>
            </div>
            {renderIssuesTable(report.categories.system_health.issues)}
          </TabsContent>

          <TabsContent value="data_integrity" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Integridade de Dados</h3>
              <Badge className={getStatusColor(report.categories.data_integrity.status)}>
                {report.categories.data_integrity.status}
              </Badge>
            </div>
            {renderIssuesTable(report.categories.data_integrity.issues)}
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Auditoria de Usuários</h3>
              <Badge className={getStatusColor(report.categories.users.status)}>
                {report.categories.users.status}
              </Badge>
            </div>
            {renderIssuesTable(report.categories.users.issues)}
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Auditoria Financeira</h3>
              <Badge className={getStatusColor(report.categories.financial.status)}>
                {report.categories.financial.status}
              </Badge>
            </div>
            {renderIssuesTable(report.categories.financial.issues)}
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Auditoria de Integrações</h3>
              <Badge className={getStatusColor(report.categories.integrations.status)}>
                {report.categories.integrations.status}
              </Badge>
            </div>
            {renderIssuesTable(report.categories.integrations.issues)}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="default" className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
