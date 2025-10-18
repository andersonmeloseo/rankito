import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Loader2, Lightbulb, Building2, FileText } from "lucide-react";
import { FinancialConfig } from "@/hooks/useFinancialMetrics";

interface QuickCostEditorProps {
  config: FinancialConfig | null;
  onSave: (config: FinancialConfig) => void;
  isSaving: boolean;
  totalPages: number;
  totalRevenue: number;
}

export const QuickCostEditor = ({ config, onSave, isSaving, totalPages, totalRevenue }: QuickCostEditorProps) => {
  const [businessModel, setBusinessModel] = useState<"full_site" | "per_page">(config?.business_model || "per_page");
  const [costPerConversion, setCostPerConversion] = useState(config?.cost_per_conversion?.toString() || "0");
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(config?.monthly_fixed_costs?.toString() || "0");
  const [acquisitionCost, setAcquisitionCost] = useState(config?.acquisition_cost?.toString() || "0");
  const [notes, setNotes] = useState(config?.notes || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setBusinessModel(config.business_model || "per_page");
      setCostPerConversion(config.cost_per_conversion?.toString() || "0");
      setMonthlyFixedCosts(config.monthly_fixed_costs?.toString() || "0");
      setAcquisitionCost(config.acquisition_cost?.toString() || "0");
      setNotes(config.notes || "");
    }
  }, [config]);

  const handleSave = () => {
    onSave({
      ...config,
      business_model: businessModel,
      cost_per_conversion: Number(costPerConversion),
      monthly_fixed_costs: Number(monthlyFixedCosts),
      acquisition_cost: Number(acquisitionCost),
      notes,
    } as FinancialConfig);
    setHasChanges(false);
  };

  const costPerPage = totalPages > 0 ? Number(monthlyFixedCosts) / totalPages : 0;
  const totalCosts = Number(monthlyFixedCosts);
  const netProfit = totalRevenue - totalCosts;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuração Financeira do Projeto
        </CardTitle>
        <CardDescription>
          Configure o modelo de negócio e custos operacionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modelo de Negócio */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Modelo de Negócio</Label>
          <RadioGroup value={businessModel} onValueChange={(v) => {
            setBusinessModel(v as "full_site" | "per_page");
            setHasChanges(true);
          }}>
            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="full_site" id="full_site" />
              <Label htmlFor="full_site" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Projeto Completo</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Aluguel do site inteiro. Valor fixo mensal independente de páginas.
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="per_page" id="per_page" />
              <Label htmlFor="per_page" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Por Página</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Aluguel individual de páginas. Custos divididos proporcionalmente.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Custos */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Custos Operacionais</Label>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyFixedCosts">
                Custos Fixos Mensais (R$)
                <span className="text-xs text-muted-foreground ml-2">
                  (Hospedagem, ferramentas, etc)
                </span>
              </Label>
              <Input
                id="monthlyFixedCosts"
                type="number"
                step="0.01"
                value={monthlyFixedCosts}
                onChange={(e) => {
                  setMonthlyFixedCosts(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerConversion">
                Custo por Lead/Conversão (R$)
                <span className="text-xs text-muted-foreground ml-2">
                  (Opcional)
                </span>
              </Label>
              <Input
                id="costPerConversion"
                type="number"
                step="0.01"
                value={costPerConversion}
                onChange={(e) => {
                  setCostPerConversion(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionCost">
                Custo de Aquisição (R$)
                <span className="text-xs text-muted-foreground ml-2">
                  (Investimento inicial)
                </span>
              </Label>
              <Input
                id="acquisitionCost"
                type="number"
                step="0.01"
                value={acquisitionCost}
                onChange={(e) => {
                  setAcquisitionCost(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Anotações sobre custos, estratégia de pricing, etc..."
              rows={3}
            />
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="rounded-lg bg-muted p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">Resumo Financeiro Atual</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receita Mensal</p>
                  <p className="font-bold text-lg">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Custos Totais</p>
                  <p className="font-bold text-lg">R$ {totalCosts.toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lucro Líquido:</span>
                  <span className={`font-bold text-lg ${netProfit < 0 ? 'text-destructive' : 'text-primary'}`}>
                    R$ {netProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Margem:</span>
                  <span className={`font-bold ${marginPercent < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                    {marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {businessModel === "per_page" && (
                <p className="text-xs text-muted-foreground pt-2">
                  Custo por página: <strong>R$ {costPerPage.toFixed(2)}</strong> ({totalPages} páginas alugadas)
                </p>
              )}

              {netProfit < 0 && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Atenção: O projeto está operando com prejuízo!
                </p>
              )}
            </div>
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
