import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, FileText, Globe, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportsTabProps {
  siteId: string;
  siteName: string;
}

export const ReportsTab = ({ siteId, siteName }: ReportsTabProps) => {
  const { toast } = useToast();
  const [reportName, setReportName] = useState(`Relatório ${siteName}`);
  const [period, setPeriod] = useState('30');
  const [includeConversions, setIncludeConversions] = useState(true);
  const [includePageViews, setIncludePageViews] = useState(true);
  const [includeROI, setIncludeROI] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-excel-report', {
        body: {
          siteId,
          reportName,
          period,
          includeConversions,
          includePageViews,
          includeROI
        }
      });

      if (error) throw error;

      // Cria blob e faz download
      const blob = new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName.replace(/\s/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Relatório Excel gerado!",
        description: "O download começará em instantes.",
      });
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "❌ Erro ao gerar relatório",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: {
          siteId,
          reportName,
          period,
          includeConversions,
          includePageViews,
          includeROI
        }
      });

      if (error) throw error;

      // Abre HTML em nova aba para usuário imprimir como PDF
      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast({
        title: "✅ Visualização PDF aberta!",
        description: "Use Ctrl+P (Cmd+P no Mac) para salvar como PDF",
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "❌ Erro ao gerar relatório",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHTML = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-html-report', {
        body: {
          siteId,
          reportName,
          period,
          includeConversions,
          includePageViews,
          includeROI
        }
      });

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName.replace(/\s/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Relatório HTML gerado!",
        description: "Abra o arquivo no navegador para visualizar.",
      });
    } catch (error: any) {
      console.error('Error exporting HTML:', error);
      toast({
        title: "❌ Erro ao gerar relatório",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Configuração do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome do Relatório */}
          <div>
            <label className="text-sm font-medium mb-2 block">Nome do Relatório</label>
            <Input 
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Digite o nome do relatório"
            />
          </div>

          {/* Período */}
          <div>
            <label className="text-sm font-medium mb-2 block">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="21">Últimos 21 dias</SelectItem>
                <SelectItem value="28">Últimos 28 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados a Incluir */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dados a Incluir</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={includeConversions} 
                  onCheckedChange={(checked) => setIncludeConversions(!!checked)} 
                />
                <span className="text-sm">Conversões</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={includePageViews} 
                  onCheckedChange={(checked) => setIncludePageViews(!!checked)} 
                />
                <span className="text-sm">Page Views</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={includeROI} 
                  onCheckedChange={(checked) => setIncludeROI(!!checked)} 
                />
                <span className="text-sm">Análise de ROI</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={handleExportExcel} 
              disabled={isExporting}
              className="w-full"
              variant="default"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isExporting ? 'Gerando...' : 'Exportar XLSX'}
            </Button>
            
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="w-full"
              variant="default"
            >
              <FileText className="mr-2 h-4 w-4" />
              {isExporting ? 'Gerando...' : 'Exportar PDF'}
            </Button>
            
            <Button 
              onClick={handleExportHTML} 
              disabled={isExporting}
              className="w-full"
              variant="default"
            >
              <Globe className="mr-2 h-4 w-4" />
              {isExporting ? 'Gerando...' : 'Gerar HTML'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            💡 O HTML interativo inclui gráficos Chart.js, tabelas ordenáveis e pode ser aberto offline no navegador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
