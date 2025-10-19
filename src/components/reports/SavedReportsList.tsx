import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSavedReports, SavedReport } from '@/hooks/useSavedReports';
import { Eye, Trash2, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedReportsListProps {
  siteId: string;
  onLoadReport: (report: SavedReport) => void;
}

export const SavedReportsList = ({ siteId, onLoadReport }: SavedReportsListProps) => {
  const { savedReports, loading, listReports, deleteReport } = useSavedReports();

  useEffect(() => {
    listReports(siteId);
  }, [siteId]);

  if (loading && savedReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Relatórios Salvos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (savedReports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Relatórios Salvos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum relatório salvo ainda. Gere um relatório e clique em "Salvar Relatório" para adicioná-lo aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Relatórios Salvos ({savedReports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {savedReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{report.report_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR
                  })}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {report.financial_config.locale}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {report.financial_config.currency}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLoadReport(report)}
                  title="Visualizar relatório"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este relatório?')) {
                      deleteReport(report.id);
                    }
                  }}
                  title="Excluir relatório"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
