import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportNameInput } from "./ReportNameInput";
import { ReportStyleConfigurator } from "./ReportStyleConfigurator";
import { ReportConfigPanel, ReportConfig } from "./ReportConfigPanel";
import { ReportPreview } from "./ReportPreview";
import { ReportExportButtons } from "./ReportExportButtons";
import { chartThemes, getThemeColors } from "@/lib/reports/chartThemes";
import { ReportData, generateExcelReport } from "@/lib/reports/generateExcel";
import { generatePDFReport } from "@/lib/reports/generatePDF";
import { generateInteractiveHTML } from "@/lib/reports/generateHTML";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

interface ReportsTabProps {
  siteId: string;
  siteName: string;
}

export const ReportsTab = ({ siteId, siteName }: ReportsTabProps) => {
  const [reportName, setReportName] = useState(`Relatório de ${siteName} - ${format(new Date(), "MM/yyyy")}`);
  const [theme, setTheme] = useState("moderno");
  const [customColors, setCustomColors] = useState({
    primary: chartThemes.moderno.colors.primary,
    secondary: chartThemes.moderno.colors.secondary,
    accent: chartThemes.moderno.colors.accent,
  });
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    const themeColors = chartThemes[newTheme].colors;
    setCustomColors({
      primary: themeColors.primary,
      secondary: themeColors.secondary,
      accent: themeColors.accent,
    });
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handleGenerate = async (newConfig: ReportConfig) => {
    setIsGenerating(true);
    setConfig(newConfig);
    
    try {
      // Calcular datas
      const endDate = new Date();
      let startDate: Date;
      
      if (newConfig.period === "all") {
        // Buscar data da primeira conversão
        const { data: firstConversion } = await supabase
          .from("rank_rent_conversions")
          .select("created_at")
          .eq("site_id", siteId)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        
        startDate = firstConversion ? new Date(firstConversion.created_at) : subDays(endDate, 365);
      } else {
        startDate = subDays(endDate, parseInt(newConfig.period));
      }

      // Buscar dados diários
      const { data: conversionsData } = await supabase
        .from("rank_rent_conversions")
        .select("*")
        .eq("site_id", siteId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Processar dados diários
      const dailyMap = new Map<string, { conversions: number; pageViews: number }>();
      
      conversionsData?.forEach(conv => {
        const date = format(new Date(conv.created_at), "yyyy-MM-dd");
        const existing = dailyMap.get(date) || { conversions: 0, pageViews: 0 };
        
        if (conv.event_type === "page_view") {
          existing.pageViews++;
        } else {
          existing.conversions++;
        }
        
        dailyMap.set(date, existing);
      });

      const dailyData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          conversions: data.conversions,
          pageViews: data.pageViews,
          conversionRate: data.pageViews > 0 ? (data.conversions / data.pageViews) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Buscar dados de páginas
      const { data: pagesData } = await supabase
        .from("rank_rent_page_metrics")
        .select("*")
        .eq("site_id", siteId);

      const topPages = (pagesData || [])
        .filter(p => p.total_conversions > 0)
        .sort((a, b) => b.total_conversions - a.total_conversions)
        .slice(0, 20)
        .map(p => ({
          page: p.page_path || p.page_url,
          conversions: p.total_conversions,
          pageViews: p.total_page_views,
          conversionRate: p.conversion_rate || 0,
        }));

      const bottomPages = (pagesData || [])
        .filter(p => p.total_page_views > 0)
        .sort((a, b) => (a.conversion_rate || 0) - (b.conversion_rate || 0))
        .slice(0, 20)
        .map(p => ({
          page: p.page_path || p.page_url,
          conversions: p.total_conversions,
          pageViews: p.total_page_views,
          conversionRate: p.conversion_rate || 0,
        }));

      // Calcular conversões por tipo
      const typeMap = new Map<string, number>();
      conversionsData?.forEach(conv => {
        if (conv.event_type !== "page_view") {
          const count = typeMap.get(conv.event_type) || 0;
          typeMap.set(conv.event_type, count + 1);
        }
      });

      const totalConversionEvents = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);
      const conversionsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
        type: type === "whatsapp_click" ? "WhatsApp" : type === "phone_click" ? "Telefone" : type === "form_submit" ? "Formulário" : type,
        count,
        percentage: totalConversionEvents > 0 ? (count / totalConversionEvents) * 100 : 0,
      }));

      // Buscar dados de ROI se solicitado
      let roi: number | undefined;
      if (newConfig.includeROI) {
        const { data: financialData } = await supabase
          .from("rank_rent_financial_metrics")
          .select("roi_percentage")
          .eq("site_id", siteId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        roi = financialData?.roi_percentage;
      }

      // Montar dados do relatório
      const totalPageViews = dailyData.reduce((sum, d) => sum + d.pageViews, 0);
      const totalConversions = dailyData.reduce((sum, d) => sum + d.conversions, 0);

      const report: ReportData = {
        name: reportName,
        period: {
          start: format(startDate, "dd/MM/yyyy"),
          end: format(endDate, "dd/MM/yyyy"),
        },
        summary: {
          totalConversions,
          totalPageViews,
          conversionRate: totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0,
          roi,
        },
        dailyData,
        topPages,
        bottomPages,
        conversionsByType: conversionsByType.length > 0 ? conversionsByType : undefined,
      };

      setReportData(report);
      
      toast({
        title: "Relatório gerado!",
        description: "Pré-visualização pronta. Agora você pode exportar nos formatos desejados.",
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao processar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportXLSX = () => {
    if (!reportData) return;
    
    try {
      generateExcelReport(reportData);
      toast({
        title: "XLSX exportado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar XLSX:", error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo XLSX.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!reportData || !previewRef.current) return;
    
    try {
      const colors = getThemeColors(theme, customColors);
      await generatePDFReport(reportData, previewRef.current, colors);
      toast({
        title: "PDF exportado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportHTML = () => {
    if (!reportData) return;
    
    try {
      const colors = getThemeColors(theme, customColors);
      generateInteractiveHTML(reportData, colors, theme);
      toast({
        title: "HTML exportado!",
        description: "O arquivo interativo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar HTML:", error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao gerar o arquivo HTML.",
        variant: "destructive",
      });
    }
  };

  const colors = getThemeColors(theme, customColors);
  const gradient = chartThemes[theme].gradient;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo - Configuração */}
        <div className="space-y-6">
          <ReportNameInput value={reportName} onChange={setReportName} />
          <ReportConfigPanel onGenerate={handleGenerate} />
          <ReportStyleConfigurator
            theme={theme}
            customColors={customColors}
            onThemeChange={handleThemeChange}
            onColorChange={handleColorChange}
          />
        </div>

        {/* Lado Direito - Preview */}
        <div className="space-y-6">
          {isGenerating && (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-semibold">Gerando relatório...</p>
                <p className="text-sm text-muted-foreground">Processando dados, por favor aguarde</p>
              </div>
            </div>
          )}
          
          {!isGenerating && !reportData && (
            <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">👈 Configure o relatório</p>
                <p className="text-sm">Escolha as opções desejadas e clique em "Gerar Pré-visualização"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview e Exportação */}
      {reportData && config && !isGenerating && (
        <div className="space-y-6">
          <div ref={previewRef}>
            <ReportPreview
              data={reportData}
              config={config}
              colors={colors}
              gradient={gradient}
            />
          </div>
          
          <ReportExportButtons
            onExportXLSX={handleExportXLSX}
            onExportPDF={handleExportPDF}
            onExportHTML={handleExportHTML}
            isGenerating={isGenerating}
          />
        </div>
      )}
    </div>
  );
};
