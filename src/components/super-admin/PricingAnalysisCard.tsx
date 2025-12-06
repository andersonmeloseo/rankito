import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Target, 
  Users, 
  PiggyBank,
  Server,
  Globe,
  Mail,
  MapPin,
  Zap,
  Shield,
  Edit3
} from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

interface CostConfig {
  supabase: number;
  domain: number;
  email: number;
  mapbox: number;
  apis: number;
  reserve: number;
  variablePerUser: number;
  desiredMargin: number;
}

const defaultCosts: CostConfig = {
  supabase: 125,
  domain: 10,
  email: 25,
  mapbox: 50,
  apis: 50,
  reserve: 100,
  variablePerUser: 4,
  desiredMargin: 80,
};

const planMix = {
  conservative: { starter: 0.6, professional: 0.3, enterprise: 0.1 },
  realistic: { starter: 0.4, professional: 0.4, enterprise: 0.2 },
  optimistic: { starter: 0.2, professional: 0.5, enterprise: 0.3 },
};

export const PricingAnalysisCard = () => {
  const { plans } = useSubscriptionPlans();
  const [costs, setCosts] = useState<CostConfig>(defaultCosts);
  const [isEditing, setIsEditing] = useState(false);

  const activePlans = useMemo(() => 
    plans?.filter(p => p.is_active && p.price > 0) || [], 
    [plans]
  );

  const totalFixedCosts = useMemo(() => 
    costs.supabase + costs.domain + costs.email + costs.mapbox + costs.apis + costs.reserve,
    [costs]
  );

  const planMargins = useMemo(() => {
    return activePlans.map(plan => {
      const variableCost = plan.name.toLowerCase().includes('enterprise') 
        ? costs.variablePerUser * 2 
        : plan.name.toLowerCase().includes('professional') 
          ? costs.variablePerUser * 1.25 
          : costs.variablePerUser;
      
      const grossMargin = plan.price - variableCost;
      const marginPercent = (grossMargin / plan.price) * 100;
      
      return {
        name: plan.name,
        price: plan.price,
        variableCost,
        grossMargin,
        marginPercent,
      };
    });
  }, [activePlans, costs.variablePerUser]);

  const calculateScenario = (mix: { starter: number; professional: number; enterprise: number }, totalClients: number) => {
    const starterPlan = activePlans.find(p => p.name.toLowerCase().includes('starter'));
    const proPlan = activePlans.find(p => p.name.toLowerCase().includes('professional'));
    const entPlan = activePlans.find(p => p.name.toLowerCase().includes('enterprise'));

    const starterPrice = starterPlan?.price || 97;
    const proPrice = proPlan?.price || 297;
    const entPrice = entPlan?.price || 697;

    const avgRevenue = (mix.starter * starterPrice) + (mix.professional * proPrice) + (mix.enterprise * entPrice);
    const mrr = avgRevenue * totalClients;
    const arr = mrr * 12;
    
    const totalVariableCost = totalClients * costs.variablePerUser;
    const totalCosts = totalFixedCosts + totalVariableCost;
    const netProfit = mrr - totalCosts;
    const netMargin = (netProfit / mrr) * 100;

    const breakEven = Math.ceil(totalFixedCosts / (avgRevenue - costs.variablePerUser));

    return { avgRevenue, mrr, arr, totalCosts, netProfit, netMargin, breakEven };
  };

  const scenarios = useMemo(() => ({
    conservative: calculateScenario(planMix.conservative, 1000),
    realistic: calculateScenario(planMix.realistic, 1000),
    optimistic: calculateScenario(planMix.optimistic, 1000),
  }), [activePlans, costs, totalFixedCosts]);

  const currentBreakEven = useMemo(() => {
    const avgMargin = planMargins.reduce((sum, p) => sum + p.grossMargin, 0) / planMargins.length || 150;
    return Math.ceil(totalFixedCosts / avgMargin);
  }, [totalFixedCosts, planMargins]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const updateCost = (key: keyof CostConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCosts(prev => ({ ...prev, [key]: numValue }));
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Análise de Precificação e Custos</CardTitle>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Edit3 className="h-4 w-4" />
          {isEditing ? "Fechar Edição" : "Editar Custos"}
        </button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Server className="h-4 w-4" />
                <span className="text-xs font-medium">Custos Fixos</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(totalFixedCosts)}
              </p>
              <p className="text-xs text-blue-600/70">/mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Custo/Usuário</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(costs.variablePerUser)}
              </p>
              <p className="text-xs text-purple-600/70">/mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Break-Even</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {currentBreakEven} clientes
              </p>
              <p className="text-xs text-green-600/70">para cobrir custos fixos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Margem Média</span>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {planMargins.length > 0 
                  ? Math.round(planMargins.reduce((sum, p) => sum + p.marginPercent, 0) / planMargins.length) 
                  : 0}%
              </p>
              <p className="text-xs text-amber-600/70">dos planos ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Editable Costs Section */}
        {isEditing && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Custos Operacionais (Editável)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Server className="h-3 w-3" /> Supabase Pro
                  </Label>
                  <Input
                    type="number"
                    value={costs.supabase}
                    onChange={(e) => updateCost('supabase', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Globe className="h-3 w-3" /> Domínio + SSL
                  </Label>
                  <Input
                    type="number"
                    value={costs.domain}
                    onChange={(e) => updateCost('domain', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Mail className="h-3 w-3" /> Email (Resend)
                  </Label>
                  <Input
                    type="number"
                    value={costs.email}
                    onChange={(e) => updateCost('email', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" /> Mapbox
                  </Label>
                  <Input
                    type="number"
                    value={costs.mapbox}
                    onChange={(e) => updateCost('mapbox', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Zap className="h-3 w-3" /> APIs Externas
                  </Label>
                  <Input
                    type="number"
                    value={costs.apis}
                    onChange={(e) => updateCost('apis', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Shield className="h-3 w-3" /> Reserva Operacional
                  </Label>
                  <Input
                    type="number"
                    value={costs.reserve}
                    onChange={(e) => updateCost('reserve', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" /> Custo Variável/Usuário
                  </Label>
                  <Input
                    type="number"
                    value={costs.variablePerUser}
                    onChange={(e) => updateCost('variablePerUser', e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-xs">
                    <DollarSign className="h-3 w-3" /> Margem Desejada (%)
                  </Label>
                  <Input
                    type="number"
                    value={costs.desiredMargin}
                    onChange={(e) => updateCost('desiredMargin', e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Margin per Plan */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Margem por Plano
          </h3>
          <div className="space-y-3">
            {planMargins.map((plan) => (
              <div key={plan.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(plan.price)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-xs">
                      Custo: {formatCurrency(plan.variableCost)}
                    </span>
                    <span className="text-xs">
                      Margem: {formatCurrency(plan.grossMargin)}
                    </span>
                    <Badge 
                      variant={plan.marginPercent >= 90 ? "default" : plan.marginPercent >= 70 ? "secondary" : "destructive"}
                      className="min-w-[60px] justify-center"
                    >
                      {plan.marginPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={plan.marginPercent} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Revenue Projection */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Projeção de Receita - Meta 1000 Assinantes (Março 2026)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conservative */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    Conservador
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  60% Starter, 30% Pro, 10% Ent
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita Média:</span>
                  <span className="font-medium">{formatCurrency(scenarios.conservative.avgRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRR:</span>
                  <span className="font-bold text-lg">{formatCurrency(scenarios.conservative.mrr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ARR:</span>
                  <span className="font-medium">{formatCurrency(scenarios.conservative.arr)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custos Totais:</span>
                  <span className="text-destructive">{formatCurrency(scenarios.conservative.totalCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Líquido:</span>
                  <span className="font-bold text-green-600">{formatCurrency(scenarios.conservative.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem Líquida:</span>
                  <Badge className="bg-green-600">{scenarios.conservative.netMargin.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Realistic */}
            <Card className="border-blue-200 bg-blue-50/50 ring-2 ring-blue-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className="bg-blue-600">
                    Realista
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  40% Starter, 40% Pro, 20% Ent
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita Média:</span>
                  <span className="font-medium">{formatCurrency(scenarios.realistic.avgRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRR:</span>
                  <span className="font-bold text-lg">{formatCurrency(scenarios.realistic.mrr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ARR:</span>
                  <span className="font-medium">{formatCurrency(scenarios.realistic.arr)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custos Totais:</span>
                  <span className="text-destructive">{formatCurrency(scenarios.realistic.totalCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Líquido:</span>
                  <span className="font-bold text-green-600">{formatCurrency(scenarios.realistic.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem Líquida:</span>
                  <Badge className="bg-green-600">{scenarios.realistic.netMargin.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Optimistic */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Otimista
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  20% Starter, 50% Pro, 30% Ent
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita Média:</span>
                  <span className="font-medium">{formatCurrency(scenarios.optimistic.avgRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRR:</span>
                  <span className="font-bold text-lg">{formatCurrency(scenarios.optimistic.mrr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ARR:</span>
                  <span className="font-medium">{formatCurrency(scenarios.optimistic.arr)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custos Totais:</span>
                  <span className="text-destructive">{formatCurrency(scenarios.optimistic.totalCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro Líquido:</span>
                  <span className="font-bold text-green-600">{formatCurrency(scenarios.optimistic.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem Líquida:</span>
                  <Badge className="bg-green-600">{scenarios.optimistic.netMargin.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Break-Even Detail */}
        <Separator />
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Análise de Break-Even por Cenário
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-600">{scenarios.conservative.breakEven}</p>
              <p className="text-xs text-muted-foreground">clientes (Conservador)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{scenarios.realistic.breakEven}</p>
              <p className="text-xs text-muted-foreground">clientes (Realista)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{scenarios.optimistic.breakEven}</p>
              <p className="text-xs text-muted-foreground">clientes (Otimista)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
