import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { useScenarioSimulator } from "@/hooks/useScenarioSimulator";
import { FinancialMetric, FinancialConfig } from "@/hooks/useFinancialMetrics";

interface ScenarioSimulatorProps {
  metrics: FinancialMetric[];
  config: FinancialConfig | null;
}

export const ScenarioSimulator = ({ metrics, config }: ScenarioSimulatorProps) => {
  const [priceIncrease, setPriceIncrease] = useState(20);
  const [costIncrease, setCostIncrease] = useState(50);
  const [growthMonths, setGrowthMonths] = useState(6);
  const [monthlyGrowth, setMonthlyGrowth] = useState(10);

  const { simulatePriceIncrease, simulateCostIncrease } = useScenarioSimulator(metrics, config);

  const priceScenario = simulatePriceIncrease(priceIncrease);
  const costScenario = simulateCostIncrease(costIncrease);
  
  // Projeção de crescimento
  const currentRevenue = metrics.reduce((sum, m) => sum + Number(m.monthly_revenue), 0);
  const currentProfit = metrics.reduce((sum, m) => sum + Number(m.monthly_profit), 0);
  const projectedRevenue = currentRevenue * Math.pow(1 + monthlyGrowth / 100, growthMonths);
  const projectedProfit = projectedRevenue - (config?.monthly_fixed_costs || 0);
  const totalGrowth = projectedRevenue - currentRevenue;

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
          🔮 Simulador de Cenários
        </CardTitle>
        <CardDescription>Simule diferentes cenários financeiros antes de aplicar</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price">Aumento de Preços</TabsTrigger>
            <TabsTrigger value="cost">Aumento de Custos</TabsTrigger>
            <TabsTrigger value="growth">Projeção de Crescimento</TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Aumentar todos os preços em: {priceIncrease}%</Label>
              <Slider
                value={[priceIncrease]}
                onValueChange={(v) => setPriceIncrease(v[0])}
                min={-50}
                max={100}
                step={5}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Receita Atual</p>
                <p className="text-2xl font-bold">{formatCurrency(priceScenario.currentRevenue)}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Nova Receita</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(priceScenario.newRevenue)}</p>
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                {priceScenario.difference > 0 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Impacto no Lucro</p>
                  <p className="text-2xl font-bold">
                    {priceScenario.difference > 0 ? "+" : ""}
                    {formatCurrency(priceScenario.difference)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {priceScenario.percentageChange > 0 ? "+" : ""}
                    {priceScenario.percentageChange.toFixed(1)}% de aumento
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cost" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Se os custos aumentarem: {costIncrease}%</Label>
              <Slider
                value={[costIncrease]}
                onValueChange={(v) => setCostIncrease(v[0])}
                min={0}
                max={200}
                step={10}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Custos Atuais</p>
                <p className="text-2xl font-bold">{formatCurrency(costScenario.currentCosts)}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Novos Custos</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(costScenario.newCosts)}</p>
              </div>
            </div>

            <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Impacto no Lucro</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(costScenario.difference)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {costScenario.percentageChange.toFixed(1)}% de redução
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Crescimento mensal: {monthlyGrowth}%</Label>
                <Slider
                  value={[monthlyGrowth]}
                  onValueChange={(v) => setMonthlyGrowth(v[0])}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Projetar para: {growthMonths} meses</Label>
                <Slider
                  value={[growthMonths]}
                  onValueChange={(v) => setGrowthMonths(v[0])}
                  min={1}
                  max={24}
                  step={1}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Receita Atual</p>
                <p className="text-2xl font-bold">{formatCurrency(currentRevenue)}</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Receita Projetada</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(projectedRevenue)}</p>
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Projeção em {growthMonths} meses</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Crescimento Total</p>
                      <p className="text-xl font-bold text-primary">
                        +{formatCurrency(totalGrowth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro Projetado</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(projectedProfit)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Crescimento de {((projectedRevenue / currentRevenue - 1) * 100).toFixed(0)}% no período
                  </p>
                </div>
              </div>

              {projectedProfit < currentProfit && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ Considere ajustar custos fixos para manter margem saudável
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
