import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileText, Globe, Eye, DollarSign, Save, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useReportData } from "@/hooks/useReportData";
import { useReportHTML } from "@/hooks/useReportHTML";
import { ReportStyleConfigurator, ReportStyle } from "./ReportStyleConfigurator";
import { ReportPreview } from "./ReportPreview";
import { Currency, ReportLocale } from "@/i18n/reportTranslations";
import { SavedReportsList } from "./SavedReportsList";
import { SaveReportDialog } from "./SaveReportDialog";

interface ReportsTabProps {
  siteId: string;
  siteName: string;
}

export const ReportsTab = ({ siteId, siteName }: ReportsTabProps) => {
  const { toast } = useToast();
  const { reportData, loading, fetchReportData } = useReportData();
  const { captureReportHTML } = useReportHTML();
  const [reportName, setReportName] = useState(`Relatório ${siteName}`);
  const [period, setPeriod] = useState('30');
  const [includeConversions, setIncludeConversions] = useState(true);
  const [includePageViews, setIncludePageViews] = useState(true);
  const [includeROI, setIncludeROI] = useState(true);
  const [includeTopPages, setIncludeTopPages] = useState(true);
  const [includeReferrers, setIncludeReferrers] = useState(false);
  const [includeEcommerce, setIncludeEcommerce] = useState(false);
  const [enableComparison, setEnableComparison] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [costPerConversion, setCostPerConversion] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [locale, setLocale] = useState<ReportLocale>('pt-BR');
  const [style, setStyle] = useState<ReportStyle>({
    theme: 'modern',
    customColors: {
      primary: '#8b5cf6',
      secondary: '#6366f1',
      accent: '#06b6d4'
    }
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Carregar configuração financeira do localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(`financial-config-${siteId}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setCostPerConversion(parsed.costPerConversion?.toString() || '');
        setCurrency(parsed.currency || 'BRL');
        setLocale(parsed.locale || 'pt-BR');
      } catch (e) {
        console.error('Erro ao carregar configuração financeira:', e);
      }
    }
  }, [siteId]);

  // Salvar configuração financeira no localStorage
  useEffect(() => {
    if (costPerConversion) {
      const config = {
        costPerConversion: parseFloat(costPerConversion),
        currency,
        locale
      };
      localStorage.setItem(`financial-config-${siteId}`, JSON.stringify(config));
    }
  }, [costPerConversion, currency, locale, siteId]);

  const handleGeneratePreview = async () => {
    // Validar custo por conversão
    if (!costPerConversion || parseFloat(costPerConversion) <= 0) {
      toast({
        title: "⚠️ Configuração incompleta",
        description: "Por favor, informe o custo por conversão antes de gerar o preview.",
        variant: "destructive"
      });
      return;
    }

    const financialConfig = {
      costPerConversion: parseFloat(costPerConversion),
      currency,
      locale
    };

    const periodDays = period === 'all' ? -1 : parseInt(period);
    await fetchReportData(siteId, periodDays, enableComparison, financialConfig);
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
          includeEcommerce,
          style,
          financialConfig: costPerConversion ? {
            costPerConversion: parseFloat(costPerConversion),
            currency,
            locale
          } : undefined
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
    if (!reportData || !siteId) return;
    
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const reportElement = document.getElementById('report-preview');
      if (!reportElement) {
        throw new Error('Elemento de preview não encontrado');
      }

      toast({
        title: "Gerando PDF...",
        description: "Capturando imagens do relatório, aguarde...",
      });

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

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

      const fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "✅ PDF baixado com sucesso!",
        description: "O download iniciou automaticamente.",
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "❌ Erro ao gerar PDF",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHTML = async () => {
    setIsExporting(true);
    try {
      // Capturar HTML renderizado (mesma técnica do PDF)
      const element = document.getElementById('report-preview');
      if (!element) {
        toast({
          title: "❌ Erro",
          description: "Elemento de preview não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Obter HTML completo
      const htmlContent = element.outerHTML;

      // Obter estilos CSS da página
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            return '';
          }
        })
        .join('\n');

      // Enviar para edge function
      const { data, error } = await supabase.functions.invoke('generate-html-report', {
        body: {
          htmlContent,
          styles,
          reportName: reportName || 'Relatório',
          siteName: siteName,
          period: reportData?.period ? `${reportData.period.start} - ${reportData.period.end}` : `${period} dias`
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

  const handleLoadReport = (reportData: any) => {
    setReportName(reportData.reportName);
    setCostPerConversion(reportData.financialConfig.costPerConversion.toString());
    setCurrency(reportData.financialConfig.currency);
    setLocale(reportData.financialConfig.locale);
    setStyle(reportData.style);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Gerar Novo Relatório
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            📁 Meus Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-6">
          <SavedReportsList 
            siteId={siteId} 
            onLoadReport={handleLoadReport}
          />
        </TabsContent>

        <TabsContent value="new" className="mt-6 space-y-6">
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
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeEcommerce} onCheckedChange={(c) => setIncludeEcommerce(!!c)} />
                <span className="text-sm">Métricas de E-commerce</span>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            💰 Configuração Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cost-per-conversion" className="mb-2 block">
              Custo por Conversão *
            </Label>
            <Input
              id="cost-per-conversion"
              type="number"
              step="0.01"
              min="0"
              value={costPerConversion}
              onChange={(e) => setCostPerConversion(e.target.value)}
              placeholder="Ex: 50.00"
              className={!costPerConversion ? 'border-destructive' : ''}
            />
            {!costPerConversion && (
              <p className="text-xs text-destructive mt-1">
                Este campo é obrigatório para calcular o valor gerado
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency" className="mb-2 block">
                Moeda
              </Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">R$ (Real Brasileiro)</SelectItem>
                  <SelectItem value="USD">$ (Dólar Americano)</SelectItem>
                  <SelectItem value="EUR">€ (Euro)</SelectItem>
                  <SelectItem value="GBP">£ (Libra Esterlina)</SelectItem>
                  <SelectItem value="MXN">$ (Peso Mexicano)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="locale" className="mb-2 block">
                Idioma do Relatório
              </Label>
              <Select value={locale} onValueChange={(v) => setLocale(v as ReportLocale)}>
                <SelectTrigger id="locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">🇧🇷 Português</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English</SelectItem>
                  <SelectItem value="es-ES">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReportStyleConfigurator style={style} onStyleChange={setStyle} />

      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleGeneratePreview} 
            disabled={loading || !costPerConversion} 
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
            includeEcommerce={includeEcommerce}
            financialConfig={costPerConversion ? {
              costPerConversion: parseFloat(costPerConversion),
              currency,
              locale
            } : undefined}
          />

          <Card>
            <CardHeader>
              <CardTitle>📥 Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  💾 Salvar Relatório
                </Button>
                
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
              </div>
            </CardContent>
          </Card>
        </>
      )}
        </TabsContent>
      </Tabs>

      {showSaveDialog && reportData && (
        <SaveReportDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          siteId={siteId}
          reportData={reportData}
          style={style}
          financialConfig={{
            costPerConversion: parseFloat(costPerConversion),
            currency,
            locale
          }}
          defaultName={reportName}
        />
      )}
    </div>
  );
};
