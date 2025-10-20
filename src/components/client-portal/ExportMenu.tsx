import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Mail, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExportMenuProps {
  siteId: string;
  reportData: any;
}

export const ExportMenu = ({ siteId, reportData }: ExportMenuProps) => {
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      toast({
        title: "Gerando PDF...",
        description: "Seu relatório está sendo preparado",
      });

      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { siteId, reportData }
      });

      if (error) throw error;

      // Download PDF
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `relatorio-${siteId}.pdf`;
      link.click();

      toast({
        title: "PDF gerado!",
        description: "Download iniciado automaticamente",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      toast({
        title: "Gerando Excel...",
        description: "Seu relatório está sendo preparado",
      });

      const { data, error } = await supabase.functions.invoke('generate-excel-report', {
        body: { siteId, reportData }
      });

      if (error) throw error;

      const link = document.createElement('a');
      link.href = data.url;
      link.download = `relatorio-${siteId}.xlsx`;
      link.click();

      toast({
        title: "Excel gerado!",
        description: "Download iniciado automaticamente",
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Erro ao gerar Excel",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const handleShareLink = async () => {
    try {
      // Generate share token
      const { data, error } = await supabase
        .from('report_shares')
        .insert({
          site_id: siteId,
          report_data: reportData,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/report/${data.share_token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "Link copiado!",
        description: "Link válido por 7 dias",
      });
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Erro ao compartilhar",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Exportar Relatório</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleShareLink}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
