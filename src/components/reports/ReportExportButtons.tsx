import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, FileText, Globe } from "lucide-react";

interface ReportExportButtonsProps {
  onExportXLSX: () => void;
  onExportPDF: () => void;
  onExportHTML: () => void;
  isGenerating?: boolean;
}

export const ReportExportButtons = ({
  onExportXLSX,
  onExportPDF,
  onExportHTML,
  isGenerating = false,
}: ReportExportButtonsProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onExportXLSX}
            disabled={isGenerating}
            className="flex-1"
            variant="outline"
            size="lg"
          >
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Exportar XLSX
          </Button>

          <Button
            onClick={onExportPDF}
            disabled={isGenerating}
            className="flex-1"
            variant="outline"
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            Exportar PDF
          </Button>

          <Button
            onClick={onExportHTML}
            disabled={isGenerating}
            className="flex-1"
            size="lg"
          >
            <Globe className="mr-2 h-5 w-5" />
            Gerar HTML Interativo
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground text-center mt-4">
          O HTML gerado é totalmente interativo com filtros, ordenação e gráficos animados
        </p>
      </CardContent>
    </Card>
  );
};
