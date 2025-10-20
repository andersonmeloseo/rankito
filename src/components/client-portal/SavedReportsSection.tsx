import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SavedReportsSectionProps {
  reports: any[];
}

export const SavedReportsSection = ({ reports }: SavedReportsSectionProps) => {
  const [viewingReport, setViewingReport] = useState<any | null>(null);

  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum relatório disponível ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const downloadReport = (report: any) => {
    // Criar um blob com os dados do relatório em JSON
    const blob = new Blob([JSON.stringify(report.report_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Seus Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold">{report.report_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Gerado em {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                {report.financial_config && (
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {report.financial_config.currency || 'BRL'}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {report.financial_config.locale || 'pt-BR'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setViewingReport(report)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadReport(report)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {viewingReport && (
        <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingReport.report_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground">
                <p>Data: {format(new Date(viewingReport.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
              
              {viewingReport.report_data && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold mb-3">Dados do Relatório</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {viewingReport.report_data.topPages && (
                      <div>
                        <p className="font-medium mb-2">Páginas Principais:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {viewingReport.report_data.topPages.slice(0, 5).map((page: any, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <ExternalLink className="h-3 w-3" />
                              {page.page_title || page.page_path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {viewingReport.report_data.metricsComparison && (
                      <div>
                        <p className="font-medium mb-2">Métricas:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>Conversões: {viewingReport.report_data.metricsComparison.current?.conversions || 0}</li>
                          <li>Visualizações: {viewingReport.report_data.metricsComparison.current?.pageViews || 0}</li>
                          <li>Taxa: {viewingReport.report_data.metricsComparison.current?.conversionRate?.toFixed(2) || '0'}%</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={() => downloadReport(viewingReport)}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Relatório Completo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
