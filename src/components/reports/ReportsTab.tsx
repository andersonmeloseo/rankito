import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, FileText, Globe, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useReportData } from "@/hooks/useReportData";
import { ReportStyleConfigurator, ReportStyle } from "./ReportStyleConfigurator";
import { ReportPreview } from "./ReportPreview";

interface ReportsTabProps {
  siteId: string;
  siteName: string;
}

export const ReportsTab = ({ siteId, siteName }: ReportsTabProps) => {
  const { toast } = useToast();
  const { reportData, loading, fetchReportData } = useReportData();
  const [reportName, setReportName] = useState(`Relatório ${siteName}`);
  const [period, setPeriod] = useState('30');
  const [includeConversions, setIncludeConversions] = useState(true);
  const [includePageViews, setIncludePageViews] = useState(true);
  const [includeROI, setIncludeROI] = useState(true);
  const [includeTopPages, setIncludeTopPages] = useState(true);
  const [includeReferrers, setIncludeReferrers] = useState(false);
  const [enableComparison, setEnableComparison] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [style, setStyle] = useState<ReportStyle>({
    theme: 'modern',
    customColors: {
      primary: '#8b5cf6',
      secondary: '#6366f1',
      accent: '#06b6d4'
    }
  });

  const handleGeneratePreview = async () => {
    const periodDays = period === 'all' ? -1 : parseInt(period);
    await fetchReportData(siteId, periodDays, enableComparison);
    setShowPreview(true);
  };

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
          includeROI,
          includeTopPages,
          includeReferrers,
          style
        }
      });

      if (error) throw error;

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
          includeROI,
          includeTopPages,
          includeReferrers,
          style
        }
      });

      if (error) throw error;

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
          includeROI,
          includeTopPages,
          includeReferrers,
          style
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
          <CardTitle>⚙️ Configuração do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Nome do Relatório</Label>
            <Input 
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Digite o nome do relatório"
            />
          </div>

          <div>
            <Label className="mb-2 block">Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Dados a Incluir</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeConversions} onCheckedChange={(c) => setIncludeConversions(!!c)} />
                <span className="text-sm">Conversões</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includePageViews} onCheckedChange={(c) => setIncludePageViews(!!c)} />
                <span className="text-sm">Page Views</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeROI} onCheckedChange={(c) => setIncludeROI(!!c)} />
                <span className="text-sm">ROI Financeiro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeTopPages} onCheckedChange={(c) => setIncludeTopPages(!!c)} />
                <span className="text-sm">Top Páginas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeReferrers} onCheckedChange={(c) => setIncludeReferrers(!!c)} />
                <span className="text-sm">Performance por Referrer</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <Checkbox 
              id="enable-comparison"
              checked={enableComparison}
              onCheckedChange={(c) => setEnableComparison(!!c)}
            />
            <div className="flex-1">
              <label htmlFor="enable-comparison" className="font-medium cursor-pointer text-sm">
                Comparar com período anterior
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Mostra a variação em relação ao período anterior de mesma duração
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReportStyleConfigurator style={style} onStyleChange={setStyle} />

      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleGeneratePreview} 
            disabled={loading} 
            className="w-full"
            size="lg"
          >
            <Eye className="mr-2 h-5 w-5" />
            {loading ? 'Gerando Preview...' : '👁️ Gerar Preview'}
          </Button>
        </CardContent>
      </Card>

      {showPreview && reportData && (
        <>
          <ReportPreview
            reportName={reportName}
            reportData={reportData}
            style={style}
            includeConversions={includeConversions}
            includePageViews={includePageViews}
            includeTopPages={includeTopPages}
            includeReferrers={includeReferrers}
          />

          <Card>
            <CardHeader>
              <CardTitle>📥 Exportar Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button onClick={handleExportExcel} disabled={isExporting} className="w-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {isExporting ? 'Gerando...' : 'Exportar XLSX'}
                </Button>
                <Button onClick={handleExportPDF} disabled={isExporting} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button onClick={handleExportHTML} disabled={isExporting} className="w-full">
                  <Globe className="mr-2 h-4 w-4" />
                  Gerar HTML
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
