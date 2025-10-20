import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useSavedReports } from "@/hooks/useSavedReports";
import { useReportHTML } from "@/hooks/useReportHTML";
import { ReportData } from "@/hooks/useReportData";
import { ReportStyle } from "./ReportStyleConfigurator";
import { FinancialConfig } from "@/hooks/useSavedReports";
import { useToast } from "@/hooks/use-toast";

interface SaveReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  reportData: ReportData;
  style: ReportStyle;
  financialConfig: FinancialConfig;
  defaultName?: string;
}

export const SaveReportDialog = ({
  open,
  onOpenChange,
  siteId,
  reportData,
  style,
  financialConfig,
  defaultName = ''
}: SaveReportDialogProps) => {
  const [reportName, setReportName] = useState(defaultName);
  const { saveReport, loading } = useSavedReports();
  const { captureReportHTML } = useReportHTML();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!reportName.trim()) return;
    
    try {
      // Capturar HTML do relatório
      toast({
        title: "Capturando relatório...",
        description: "Aguarde enquanto geramos o HTML"
      });
      
      const htmlToSave = await captureReportHTML('report-preview');
      
      await saveReport(siteId, reportName, reportData, style, financialConfig, htmlToSave);
      onOpenChange(false);
      setReportName('');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Salvar Relatório
          </DialogTitle>
          <DialogDescription>
            Dê um nome para este relatório para acessá-lo facilmente depois
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="report-name">Nome do Relatório</Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Ex: Relatório Mensal - Janeiro 2024"
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !reportName.trim()}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
