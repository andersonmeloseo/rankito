import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Target, 
  Users, 
  Server,
  Globe,
  Mail,
  MapPin,
  Zap,
  Shield,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet
} from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

interface CostItem {
  id: string;
  category: string;
  name: string;
  cost: number;
  type: 'fixed' | 'variable';
  notes: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Infraestrutura': <Server className="h-4 w-4" />,
  'Comunicação': <Mail className="h-4 w-4" />,
  'Mapas': <MapPin className="h-4 w-4" />,
  'APIs': <Zap className="h-4 w-4" />,
  'Operacional': <Shield className="h-4 w-4" />,
  'Outros': <DollarSign className="h-4 w-4" />,
};

const defaultCostItems: CostItem[] = [
  { id: '1', category: 'Infraestrutura', name: 'Supabase Pro', cost: 125, type: 'fixed', notes: 'Database + Auth + Storage + Edge Functions' },
  { id: '2', category: 'Infraestrutura', name: 'Domínio + SSL', cost: 10, type: 'fixed', notes: 'rankitocrm.com' },
  { id: '3', category: 'Comunicação', name: 'Email (Resend)', cost: 25, type: 'variable', notes: '~3000 emails/mês grátis' },
  { id: '4', category: 'Mapas', name: 'Mapbox', cost: 50, type: 'variable', notes: '50k requests grátis' },
  { id: '5', category: 'APIs', name: 'GSC/IndexNow', cost: 50, type: 'fixed', notes: 'Margem para APIs externas' },
  { id: '6', category: 'Operacional', name: 'Reserva', cost: 100, type: 'fixed', notes: 'Buffer para imprevistos' },
];

const categories = ['Infraestrutura', 'Comunicação', 'Mapas', 'APIs', 'Operacional', 'Outros'];

const planMix = {
  conservative: { starter: 0.6, professional: 0.3, enterprise: 0.1 },
  realistic: { starter: 0.4, professional: 0.4, enterprise: 0.2 },
  optimistic: { starter: 0.2, professional: 0.5, enterprise: 0.3 },
};

export const PricingAnalysisCard = () => {
  const { plans } = useSubscriptionPlans();
  const [costItems, setCostItems] = useState<CostItem[]>(defaultCostItems);
  const [variablePerUser, setVariablePerUser] = useState(4);
  const [desiredMargin, setDesiredMargin] = useState(80);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CostItem | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Omit<CostItem, 'id'>>({
    category: 'Infraestrutura',
    name: '',
    cost: 0,
    type: 'fixed',
    notes: '',
  });

  const activePlans = useMemo(() => 
    plans?.filter(p => p.is_active && p.price > 0) || [], 
    [plans]
  );

  const totalFixedCosts = useMemo(() => 
    costItems.filter(item => item.type === 'fixed').reduce((sum, item) => sum + item.cost, 0),
    [costItems]
  );

  const totalVariableCosts = useMemo(() => 
    costItems.filter(item => item.type === 'variable').reduce((sum, item) => sum + item.cost, 0),
    [costItems]
  );

  const totalCosts = totalFixedCosts + totalVariableCosts;

  const planMargins = useMemo(() => {
    return activePlans.map(plan => {
      const variableCost = plan.name.toLowerCase().includes('enterprise') 
        ? variablePerUser * 2 
        : plan.name.toLowerCase().includes('professional') 
          ? variablePerUser * 1.25 
          : variablePerUser;
      
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
  }, [activePlans, variablePerUser]);

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
    
    const totalVariableCost = totalClients * variablePerUser;
    const scenarioCosts = totalFixedCosts + totalVariableCost;
    const netProfit = mrr - scenarioCosts;
    const netMargin = (netProfit / mrr) * 100;

    const breakEven = Math.ceil(totalFixedCosts / (avgRevenue - variablePerUser));

    return { avgRevenue, mrr, arr, totalCosts: scenarioCosts, netProfit, netMargin, breakEven };
  };

  const scenarios = useMemo(() => ({
    conservative: calculateScenario(planMix.conservative, 1000),
    realistic: calculateScenario(planMix.realistic, 1000),
    optimistic: calculateScenario(planMix.optimistic, 1000),
  }), [activePlans, totalFixedCosts, variablePerUser]);

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

  // CRUD handlers
  const handleAddItem = () => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      ...formData,
    };
    setCostItems([...costItems, newItem]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditItem = () => {
    if (!selectedItem) return;
    setCostItems(costItems.map(item => 
      item.id === selectedItem.id ? { ...item, ...formData } : item
    ));
    setIsEditDialogOpen(false);
    setSelectedItem(null);
    resetForm();
  };

  const handleDeleteItem = () => {
    if (!selectedItem) return;
    setCostItems(costItems.filter(item => item.id !== selectedItem.id));
    setIsDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const openEditDialog = (item: CostItem) => {
    setSelectedItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      cost: item.cost,
      type: item.type,
      notes: item.notes,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: CostItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: 'Infraestrutura',
      name: '',
      cost: 0,
      type: 'fixed',
      notes: '',
    });
  };

  // Group costs by category
  const costsByCategory = useMemo(() => {
    const grouped: Record<string, CostItem[]> = {};
    costItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [costItems]);

  return (
    <Card className="mt-6 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary opacity-80" />
          <CardTitle>Análise de Precificação e Custos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Server className="h-4 w-4 text-primary opacity-80" />
                <span className="text-xs font-medium text-muted-foreground">Custos Fixos</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalFixedCosts)}
              </p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary opacity-80" />
                <span className="text-xs font-medium text-muted-foreground">Custo/Usuário</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(variablePerUser)}
              </p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary opacity-80" />
                <span className="text-xs font-medium text-muted-foreground">Break-Even</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {currentBreakEven} clientes
              </p>
              <p className="text-xs text-muted-foreground">para cobrir custos fixos</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary opacity-80" />
                <span className="text-xs font-medium text-muted-foreground">Margem Média</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {planMargins.length > 0 
                  ? Math.round(planMargins.reduce((sum, p) => sum + p.marginPercent, 0) / planMargins.length) 
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">dos planos ativos</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Cost Spreadsheet */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary opacity-80" />
              Planilha de Custos Operacionais
            </h3>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </Button>
          </div>

          <Card className="shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Categoria</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[120px] text-right">Custo (R$)</TableHead>
                  <TableHead className="w-[100px] text-center">Tipo</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[100px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-primary opacity-70">
                          {categoryIcons[item.category] || <DollarSign className="h-4 w-4" />}
                        </span>
                        <span className="text-sm">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.cost)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.type === 'fixed' ? 'secondary' : 'outline'}>
                        {item.type === 'fixed' ? 'Fixo' : 'Variável'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.notes}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">TOTAL</TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    {formatCurrency(totalCosts)}
                  </TableCell>
                  <TableCell colSpan={3}>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Fixos: <strong className="text-foreground">{formatCurrency(totalFixedCosts)}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Variáveis: <strong className="text-foreground">{formatCurrency(totalVariableCosts)}</strong>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>

          {/* Additional cost inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                <Users className="h-3 w-3" /> Custo Variável por Usuário (R$)
              </Label>
              <Input
                type="number"
                value={variablePerUser}
                onChange={(e) => setVariablePerUser(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                <DollarSign className="h-3 w-3" /> Margem Desejada (%)
              </Label>
              <Input
                type="number"
                value={desiredMargin}
                onChange={(e) => setDesiredMargin(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Margin per Plan */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary opacity-80" />
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
            <Target className="h-4 w-4 text-primary opacity-80" />
            Projeção de Receita - Meta 1000 Assinantes (Março 2026)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conservative */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline">Conservador</Badge>
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
                  <span className="font-bold text-success">{formatCurrency(scenarios.conservative.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem Líquida:</span>
                  <Badge variant="default">{scenarios.conservative.netMargin.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Realistic */}
            <Card className="shadow-card ring-2 ring-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge>Realista</Badge>
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
                  <span className="font-bold text-success">{formatCurrency(scenarios.realistic.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem Líquida:</span>
                  <Badge variant="default">{scenarios.realistic.netMargin.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Optimistic */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline">Otimista</Badge>
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
                  <span className="font-bold text-success">{formatCurrency(scenarios.optimistic.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem Líquida:</span>
                  <Badge variant="default">{scenarios.optimistic.netMargin.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Break-Even Detail */}
        <Separator />
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary opacity-80" />
              Análise de Break-Even por Cenário
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{scenarios.conservative.breakEven}</p>
                <p className="text-xs text-muted-foreground">clientes (Conservador)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{scenarios.realistic.breakEven}</p>
                <p className="text-xs text-muted-foreground">clientes (Realista)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{scenarios.optimistic.breakEven}</p>
                <p className="text-xs text-muted-foreground">clientes (Otimista)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item de Custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Item</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: AWS S3"
              />
            </div>
            <div className="space-y-2">
              <Label>Custo Mensal (R$)</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'fixed' | 'variable') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre este custo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={!formData.name}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item de Custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Item</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Custo Mensal (R$)</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'fixed' | 'variable') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditItem} disabled={!formData.name}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedItem?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
