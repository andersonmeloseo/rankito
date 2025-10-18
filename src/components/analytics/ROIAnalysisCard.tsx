import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { useROIAnalysis } from "@/hooks/useROIAnalysis";
import { useState } from "react";

interface ROIAnalysisCardProps {
  siteId: string;
}

const PERIOD_OPTIONS = [
  { label: "Últimos 7 dias", value: "7" },
  { label: "Últimos 30 dias", value: "30" },
  { label: "Últimos 60 dias", value: "60" },
  { label: "Últimos 90 dias", value: "90" },
];

export const ROIAnalysisCard = ({ siteId }: ROIAnalysisCardProps) => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const { siteData, costPerConversion, setCostPerConversion, calculatedROI, isLoading } = useROIAnalysis({
    siteId,
    periodDays,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!siteData?.monthly_rent_value) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Valor mensal não configurado</AlertTitle>
        <AlertDescription>
          Configure o valor de aluguel mensal nas configurações do site para visualizar a análise de ROI.
        </AlertDescription>
      </Alert>
    );
  }

  if (!calculatedROI) {
    return null;
  }

  const {
    periodPercentage,
    proportionalRevenue,
    totalCost,
    netResult,
    isProfit,
    profitPercentage,
    monthlyProjection,
    conversionsCount,
    monthlyRentValue,
  } = calculatedROI;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análise de ROI - Lucro/Prejuízo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Valor mensal do contrato: {formatCurrency(monthlyRentValue)}
            </p>
          </div>
          <Select value={String(periodDays)} onValueChange={(value) => setPeriodDays(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Período Selecionado */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>
            Período Selecionado: {periodDays} dias ({periodPercentage.toFixed(0)}% do mês)
          </span>
        </div>

        {/* Cards de Receita e Custo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Valor Recebido (proporcional)</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(proportionalRevenue)}</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-sm text-muted-foreground mb-1">Custo Total</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalCost)}</p>
          </div>
        </div>

        {/* Input de Custo por Conversão */}
        <div className="space-y-2">
          <Label htmlFor="costPerConversion">Custo por Conversão</Label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="costPerConversion"
                type="number"
                min="0"
                step="0.01"
                value={costPerConversion}
                onChange={(e) => setCostPerConversion(parseFloat(e.target.value) || 0)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {conversionsCount} conversões
            </Badge>
          </div>
        </div>

        {/* Resultado */}
        <div
          className={`p-6 rounded-lg border-2 ${
            isProfit
              ? "bg-green-50 dark:bg-green-950/20 border-green-500"
              : "bg-red-50 dark:bg-red-950/20 border-red-500"
          }`}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            {isProfit ? (
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-3xl font-bold ${isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {isProfit ? "LUCRO" : "PREJUÍZO"} de {formatCurrency(Math.abs(netResult))}
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {isProfit
              ? `Margem de lucro: ${profitPercentage.toFixed(1)}% sobre o custo`
              : `Cliente está pagando menos que o custo das conversões`}
          </p>
        </div>

        {/* Projeção Mensal */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">📈 Projeção Mensal (30 dias):</span>
            <span className={`text-lg font-bold ${monthlyProjection > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {monthlyProjection > 0 ? "+" : ""}
              {formatCurrency(monthlyProjection)}
            </span>
          </div>
        </div>

        {/* Alerta de Sem Conversões */}
        {conversionsCount === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma conversão registrada no período. Custo: R$ 0,00 | Receita: {formatCurrency(proportionalRevenue)}
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de Custo Zero */}
        {costPerConversion === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Defina o custo por conversão acima para calcular o ROI corretamente.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
