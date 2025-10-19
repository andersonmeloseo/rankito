import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ReportConfigPanelProps {
  onGenerate: (config: ReportConfig) => void;
}

export interface ReportConfig {
  period: string;
  includeConversions: boolean;
  includePageViews: boolean;
  includeROI: boolean;
  includeTopPages: boolean;
  includeBottomPages: boolean;
  includeConversionTypes: boolean;
}

export const ReportConfigPanel = ({ onGenerate }: ReportConfigPanelProps) => {
  const [period, setPeriod] = useState("30");
  const [includeConversions, setIncludeConversions] = useState(true);
  const [includePageViews, setIncludePageViews] = useState(true);
  const [includeROI, setIncludeROI] = useState(true);
  const [includeTopPages, setIncludeTopPages] = useState(true);
  const [includeBottomPages, setIncludeBottomPages] = useState(true);
  const [includeConversionTypes, setIncludeConversionTypes] = useState(true);

  const handleGenerate = () => {
    onGenerate({
      period,
      includeConversions,
      includePageViews,
      includeROI,
      includeTopPages,
      includeBottomPages,
      includeConversionTypes,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚙️ Configuração do Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Período */}
        <div className="space-y-2">
          <Label>📅 Período</Label>
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
              <SelectItem value="all">Período completo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dados a Incluir */}
        <div className="space-y-3">
          <Label>📊 Dados a Incluir</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="conversions"
              checked={includeConversions}
              onCheckedChange={(checked) => setIncludeConversions(checked as boolean)}
            />
            <label htmlFor="conversions" className="text-sm cursor-pointer">
              Conversões ao longo do tempo
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pageviews"
              checked={includePageViews}
              onCheckedChange={(checked) => setIncludePageViews(checked as boolean)}
            />
            <label htmlFor="pageviews" className="text-sm cursor-pointer">
              Page Views ao longo do tempo
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="roi"
              checked={includeROI}
              onCheckedChange={(checked) => setIncludeROI(checked as boolean)}
            />
            <label htmlFor="roi" className="text-sm cursor-pointer">
              Análise de ROI
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="toppages"
              checked={includeTopPages}
              onCheckedChange={(checked) => setIncludeTopPages(checked as boolean)}
            />
            <label htmlFor="toppages" className="text-sm cursor-pointer">
              Top páginas que mais convertem
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="bottompages"
              checked={includeBottomPages}
              onCheckedChange={(checked) => setIncludeBottomPages(checked as boolean)}
            />
            <label htmlFor="bottompages" className="text-sm cursor-pointer">
              Páginas com baixa performance
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="conversiontypes"
              checked={includeConversionTypes}
              onCheckedChange={(checked) => setIncludeConversionTypes(checked as boolean)}
            />
            <label htmlFor="conversiontypes" className="text-sm cursor-pointer">
              Distribuição por tipo de conversão
            </label>
          </div>
        </div>

        {/* Botão Gerar */}
        <Button 
          onClick={handleGenerate} 
          className="w-full"
          size="lg"
        >
          👁️ Gerar Pré-visualização
        </Button>
      </CardContent>
    </Card>
  );
};
