import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { useIntelligentPricing } from "@/hooks/useIntelligentPricing";
import { FinancialMetric } from "@/hooks/useFinancialMetrics";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IntelligentPricingSuggestionsProps {
  metrics: FinancialMetric[];
  onApplyPrice?: (pageId: string, newPrice: number) => void;
}

export const IntelligentPricingSuggestions = ({ metrics, onApplyPrice }: IntelligentPricingSuggestionsProps) => {
  const { topOpportunities, avgPrice } = useIntelligentPricing(metrics);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    const variants = {
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    const labels = {
      high: "Alta confiança",
      medium: "Média confiança",
      low: "Baixa confiança",
    };
    return <Badge variant={variants[confidence] as any}>{labels[confidence]}</Badge>;
  };

  if (topOpportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Sugestões de Pricing Inteligente
          </CardTitle>
          <CardDescription>Baseado em performance e mercado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Nenhuma oportunidade de otimização detectada no momento.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Sugestões de Pricing Inteligente
        </CardTitle>
        <CardDescription>
          Top oportunidades de otimização • Média do portfólio: {formatCurrency(avgPrice)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {topOpportunities.map((suggestion) => (
              <div key={suggestion.pageId} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{suggestion.pageTitle}</p>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(suggestion.confidence)}
                      <Badge variant="outline" className="text-primary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{formatCurrency(suggestion.potentialIncrease)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {suggestion.reason}
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Atual</p>
                    <p className="font-medium">{formatCurrency(suggestion.currentPrice)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Mínimo</p>
                    <p className="font-medium text-amber-600">{formatCurrency(suggestion.suggestedMin)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Ótimo</p>
                    <p className="font-medium text-primary">{formatCurrency(suggestion.suggestedOptimal)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onApplyPrice?.(suggestion.pageId, suggestion.suggestedMin)}
                  >
                    Aplicar Mínimo
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onApplyPrice?.(suggestion.pageId, suggestion.suggestedOptimal)}
                  >
                    Aplicar Ótimo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
