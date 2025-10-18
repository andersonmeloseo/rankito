import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity } from "lucide-react";
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
  const totalGrowthPercent = currentRevenue > 0 ? (totalGrowth / currentRevenue) * 100 : 0;

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
          <Activity className="h-5 w-5" />
          Simulador de Cenários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price">Preços</TabsTrigger>
            <TabsTrigger value="cost">Custos</TabsTrigger>
            <TabsTrigger value="growth">Crescimento</TabsTrigger>
          </TabsList>

          {/* Price Increase Scenario */}
          <TabsContent value="price" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  E se aumentar os preços em: {priceIncrease}%
                </label>
                <Slider
                  value={[priceIncrease]}
                  onValueChange={(value) => setPriceIncrease(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Receita Atual</p>
                  <p className="text-lg font-semibold">{formatCurrency(currentRevenue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nova Receita</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(priceScenario.newRevenue)}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Lucro Adicional</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    +{formatCurrency(priceScenario.difference)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Cost Increase Scenario */}
          <TabsContent value="cost" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  E se os custos aumentarem: {costIncrease}%
                </label>
                <Slider
                  value={[costIncrease]}
                  onValueChange={(value) => setCostIncrease(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Lucro Atual</p>
                  <p className="text-lg font-semibold">{formatCurrency(currentProfit)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Novo Lucro</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(costScenario.newProfit)}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Impacto no Lucro</p>
                  <p className="text-xl font-bold text-red-600 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    {formatCurrency(costScenario.difference)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Growth Projection */}
          <TabsContent value="growth" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Crescimento mensal: {monthlyGrowth}%
                </label>
                <Slider
                  value={[monthlyGrowth]}
                  onValueChange={(value) => setMonthlyGrowth(value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Período: {growthMonths} meses
                </label>
                <Slider
                  value={[growthMonths]}
                  onValueChange={(value) => setGrowthMonths(value[0])}
                  min={1}
                  max={24}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Receita Atual</p>
                  <p className="text-lg font-semibold">{formatCurrency(currentRevenue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Receita Projetada</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(projectedRevenue)}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Crescimento Total</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    +{formatCurrency(projectedRevenue - currentRevenue)} ({totalGrowthPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
