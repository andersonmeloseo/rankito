import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedReportsSectionProps {
  reports: any[];
}

export const SavedReportsSection = ({ reports }: SavedReportsSectionProps) => {
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

  return (
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
            <div className="space-y-1">
              <h4 className="font-semibold">{report.report_name}</h4>
              <p className="text-sm text-muted-foreground">
                Gerado em {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
