import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSavedReports, SavedReport } from '@/hooks/useSavedReports';
import { Eye, Trash2, FolderOpen, Share2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SavedReportsListProps {
  siteId: string;
  onLoadReport: (report: SavedReport) => void;
}

export const SavedReportsList = ({ siteId, onLoadReport }: SavedReportsListProps) => {
  const { savedReports, loading, listReports, deleteReport, shareWithClient, unshareWithClient } = useSavedReports();
  const [clients, setClients] = useState<any[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');

  useEffect(() => {
    listReports(siteId);
    fetchClients();
  }, [siteId]);

  const fetchClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('rank_rent_clients')
      .select('id, name, company')
      .eq('user_id', user.id)
      .order('name');

    if (!error && data) {
      setClients(data);
    }
  };

  const handleShare = async () => {
    if (!selectedReport || !selectedClient) return;
    await shareWithClient(selectedReport.id, selectedClient);
    setShareDialogOpen(false);
    setSelectedReport(null);
    setSelectedClient('');
  };

  const handleUnshare = async (reportId: string) => {
    if (confirm('Remover este relatório do portal do cliente?')) {
      await unshareWithClient(reportId);
    }
  };

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Relatórios Salvos ({savedReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {savedReports.map((report: any) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{report.report_name}</p>
                    {report.client_id && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded border border-green-500/20">
                        Compartilhado
                      </span>
                    )}
                  </div>
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
                  {report.client_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnshare(report.id)}
                      title="Remover do portal do cliente"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setShareDialogOpen(true);
                      }}
                      title="Compartilhar com cliente"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}
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

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhar Relatório
            </DialogTitle>
            <DialogDescription>
              Selecione o cliente que poderá visualizar este relatório no portal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShareDialogOpen(false);
              setSelectedReport(null);
              setSelectedClient('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleShare} disabled={!selectedClient}>
              Compartilhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
