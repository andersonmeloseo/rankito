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
  const [targetMargin, setTargetMargin] = useState(70);

  const { simulatePriceIncrease, simulateCostIncrease, simulateTargetMargin } = useScenarioSimulator(metrics, config);

  const priceScenario = simulatePriceIncrease(priceIncrease);
  const costScenario = simulateCostIncrease(costIncrease);
  const marginSimulation = simulateTargetMargin(targetMargin);

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
            <TabsTrigger value="price">Aumentar Preços</TabsTrigger>
            <TabsTrigger value="cost">Aumentar Custos</TabsTrigger>
            <TabsTrigger value="margin">Margem Alvo</TabsTrigger>
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

          <TabsContent value="margin" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Margem alvo: {targetMargin}%</Label>
              <Slider
                value={[targetMargin]}
                onValueChange={(v) => setTargetMargin(v[0])}
                min={10}
                max={95}
                step={5}
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {marginSimulation.slice(0, 5).map((sim) => (
                <div key={sim.pageId} className="rounded-lg border p-3 space-y-1">
                  <p className="font-medium text-sm">{sim.pageTitle || sim.pageId}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Atual: {formatCurrency(sim.currentPrice)}</span>
                    <span className="font-medium text-primary">→ {formatCurrency(sim.suggestedPrice)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sim.percentageIncrease > 0 ? "+" : ""}
                    {sim.percentageIncrease.toFixed(1)}% de aumento
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
