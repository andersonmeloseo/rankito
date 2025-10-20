import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, ExternalLink, Globe } from 'lucide-react';
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

  const downloadHTML = (report: any) => {
    if (!report.report_html) {
      return;
    }
    
    const blob = new Blob([report.report_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_name.replace(/\s/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (report: any) => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = report.report_html || '';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '1200px';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempDiv);

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${report.report_name.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
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
                  Visualizar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadHTML(report)}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  HTML
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadPDF(report)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {viewingReport && (
        <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {viewingReport.report_name}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadHTML(viewingReport)}>
                    <Globe className="w-4 h-4 mr-2" />
                    HTML
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadPDF(viewingReport)}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="text-sm text-muted-foreground mb-4">
                <p>Gerado em: {format(new Date(viewingReport.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
              
              {viewingReport.report_html ? (
                <div 
                  className="report-preview-container bg-background rounded-lg"
                  dangerouslySetInnerHTML={{ __html: viewingReport.report_html }}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Preview não disponível</p>
                  <p className="text-sm mt-2">Este relatório não possui visualização HTML.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
