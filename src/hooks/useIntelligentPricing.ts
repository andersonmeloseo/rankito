import { useMemo } from "react";
import { FinancialMetric } from "./useFinancialMetrics";

interface PricingSuggestion {
  pageId: string;
  pageTitle: string;
  currentPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  suggestedOptimal: number;
  reason: string;
  confidence: "high" | "medium" | "low";
  potentialIncrease: number;
}

export const useIntelligentPricing = (metrics: FinancialMetric[]) => {
  const avgConversions = useMemo(() => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + Number(m.total_conversions), 0) / metrics.length;
  }, [metrics]);

  const avgPrice = useMemo(() => {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + Number(m.monthly_rent_value), 0) / metrics.length;
  }, [metrics]);

  const getSuggestion = (metric: FinancialMetric): PricingSuggestion => {
    const conversions = Number(metric.total_conversions);
    const currentPrice = Number(metric.monthly_rent_value);
    const totalCosts = Number(metric.monthly_conversion_costs) + Number(metric.proportional_fixed_cost);
    const roi = Number(metric.roi_percentage);
    const margin = Number(metric.profit_margin);

    let suggestedMin = totalCosts * 1.3; // Mínimo 30% margem
    let suggestedMax = totalCosts * 3; // Máximo 200% margem
    let suggestedOptimal = currentPrice;
    let reason = "";
    let confidence: "high" | "medium" | "low" = "medium";

    // Alta performance (conversões acima da média)
    if (conversions > avgConversions * 1.4) {
      suggestedOptimal = Math.max(currentPrice * 1.5, totalCosts * 2.5);
      suggestedMax = totalCosts * 4;
      reason = `Alta performance: ${conversions} conversões/mês (${Math.round((conversions / avgConversions - 1) * 100)}% acima da média). Pode cobrar mais.`;
      confidence = "high";
    }
    // Performance média-alta
    else if (conversions > avgConversions * 1.1) {
      suggestedOptimal = Math.max(currentPrice * 1.2, totalCosts * 2);
      reason = `Boa performance: ${conversions} conversões/mês. Potencial de aumento.`;
      confidence = "medium";
    }
    // Performance baixa
    else if (conversions < avgConversions * 0.5) {
      suggestedOptimal = Math.max(totalCosts * 1.5, currentPrice * 0.9);
      suggestedMax = totalCosts * 2;
      reason = `Performance abaixo da média: ${conversions} conversões/mês. Preço conservador recomendado.`;
      confidence = "low";
    }
    // Performance média
    else {
      suggestedOptimal = Math.max(currentPrice, totalCosts * 2);
      reason = `Performance média: ${conversions} conversões/mês. Mantenha ou ajuste levemente.`;
      confidence = "medium";
    }

    // Ajuste baseado em ROI
    if (roi > 10000) {
      suggestedOptimal *= 1.3;
      reason += ` ROI excepcional (${Math.round(roi)}%). Há margem para aumentar.`;
      confidence = "high";
    }

    // Ajuste baseado em margem
    if (margin > 95) {
      suggestedOptimal *= 1.2;
      reason += ` Margem muito alta (${Math.round(margin)}%). Cliente aceita mais.`;
    }

    return {
      pageId: metric.page_id,
      pageTitle: metric.page_title || metric.page_path,
      currentPrice,
      suggestedMin: Math.round(suggestedMin * 100) / 100,
      suggestedMax: Math.round(suggestedMax * 100) / 100,
      suggestedOptimal: Math.round(suggestedOptimal * 100) / 100,
      reason,
      confidence,
      potentialIncrease: Math.round((suggestedOptimal - currentPrice) * 100) / 100,
    };
  };

  const suggestions = useMemo(() => {
    return metrics
      .map(getSuggestion)
      .filter((s) => s.potentialIncrease > 0)
      .sort((a, b) => b.potentialIncrease - a.potentialIncrease);
  }, [metrics, avgConversions, avgPrice]);

  const topOpportunities = useMemo(() => {
    return suggestions.filter((s) => s.confidence === "high").slice(0, 5);
  }, [suggestions]);

  return {
    suggestions,
    topOpportunities,
    avgPrice,
    avgConversions,
    getSuggestion,
  };
};
