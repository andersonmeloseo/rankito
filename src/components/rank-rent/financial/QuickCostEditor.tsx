import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, AlertCircle } from "lucide-react";
import { FinancialConfig } from "@/hooks/useFinancialMetrics";

interface QuickCostEditorProps {
  config: FinancialConfig | null;
  onSave: (config: Partial<FinancialConfig>) => void;
  isSaving: boolean;
  totalPages: number;
  totalRevenue: number;
}

export const QuickCostEditor = ({ config, onSave, isSaving, totalPages, totalRevenue }: QuickCostEditorProps) => {
  const [businessModel, setBusinessModel] = useState<"full_site" | "per_page">(
    (config?.business_model as "full_site" | "per_page") || "full_site"
  );
  const [monthlyFixedCosts, setMonthlyFixedCosts] = useState(config?.monthly_fixed_costs?.toString() || "0");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setBusinessModel((config.business_model as "full_site" | "per_page") || "full_site");
      setMonthlyFixedCosts(config.monthly_fixed_costs?.toString() || "0");
      setHasChanges(false);
    }
  }, [config]);

  const handleSave = () => {
    onSave({
      business_model: businessModel,
      cost_per_conversion: 0,
      monthly_fixed_costs: parseFloat(monthlyFixedCosts) || 0,
      acquisition_cost: 0,
      notes: "",
    });
    setHasChanges(false);
  };

  const totalCosts = parseFloat(monthlyFixedCosts) || 0;
  const netProfit = totalRevenue - totalCosts;
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuração Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Model Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Modelo de Negócio</Label>
          <RadioGroup
            value={businessModel}
            onValueChange={(value) => {
              setBusinessModel(value as "full_site" | "per_page");
              setHasChanges(true);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full_site" id="full_site" />
              <Label htmlFor="full_site" className="font-normal cursor-pointer">
                Projeto Completo (aluguel do site inteiro)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="per_page" id="per_page" />
              <Label htmlFor="per_page" className="font-normal cursor-pointer">
                Por Página (aluguel individual)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Monthly Fixed Costs */}
        <div className="space-y-2">
          <Label htmlFor="fixed-costs">Custos Fixos Mensais</Label>
          <Input
            id="fixed-costs"
            type="number"
            placeholder="0.00"
            value={monthlyFixedCosts}
            onChange={(e) => {
              setMonthlyFixedCosts(e.target.value);
              setHasChanges(true);
            }}
          />
          <p className="text-sm text-muted-foreground">
            Hospedagem, ferramentas, domínio, etc.
          </p>
        </div>

        <Separator />

        {/* Financial Summary */}
        <div className="space-y-3 pt-2">
          <h4 className="font-semibold">Resumo Financeiro</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Receita Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Custos Totais</p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalCosts)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Lucro Líquido</p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netProfit)}
                {netProfit >= 0 ? " ✅" : " ❌"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Margem</p>
              <p className="text-lg font-semibold">{marginPercent.toFixed(1)}%</p>
            </div>
          </div>

          {netProfit < 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seu projeto está operando com prejuízo. Considere reduzir custos ou aumentar valores de aluguel.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
