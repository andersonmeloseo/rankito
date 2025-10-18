import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, Lightbulb } from "lucide-react";
import { FinancialConfig } from "@/hooks/useFinancialMetrics";

interface QuickCostEditorProps {
  config: FinancialConfig | null;
  onSave: (config: FinancialConfig) => void;
  isSaving: boolean;
  totalPages: number;
}

export const QuickCostEditor = ({ config, onSave, isSaving, totalPages }: QuickCostEditorProps) => {
  const [costPerConversion, setCostPerConversion] = useState(config?.cost_per_conversion?.toString() || "0");
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(config?.monthly_fixed_costs?.toString() || "0");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setCostPerConversion(config.cost_per_conversion?.toString() || "0");
      setMonthlyFixedCosts(config.monthly_fixed_costs?.toString() || "0");
    }
  }, [config]);

  const handleSave = () => {
    onSave({
      ...config,
      cost_per_conversion: Number(costPerConversion),
      monthly_fixed_costs: Number(monthlyFixedCosts),
      business_model: config?.business_model || "per_page",
    } as FinancialConfig);
    setHasChanges(false);
  };

  const costPerPage = totalPages > 0 ? Number(monthlyFixedCosts) / totalPages : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuração Rápida de Custos
        </CardTitle>
        <CardDescription>Edite os custos e veja o impacto em tempo real</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="costPerConversion">Custo por Conversão (R$)</Label>
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
            <Label htmlFor="monthlyFixedCosts">Custos Fixos Mensais (R$)</Label>
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
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Impacto Calculado</p>
              <p className="text-sm text-muted-foreground">
                Custo proporcional por página: <strong>R$ {costPerPage.toFixed(2)}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Baseado em {totalPages} páginas alugadas
              </p>
            </div>
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar e Recalcular
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
