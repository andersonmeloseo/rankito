import { useMemo } from "react";
import { FinancialMetric, FinancialConfig } from "./useFinancialMetrics";

interface ScenarioResult {
  currentRevenue: number;
  currentCosts: number;
  currentProfit: number;
  newRevenue: number;
  newCosts: number;
  newProfit: number;
  difference: number;
  percentageChange: number;
}

export const useScenarioSimulator = (
  metrics: FinancialMetric[],
  config: FinancialConfig | null
) => {
  const simulatePriceIncrease = (percentageIncrease: number): ScenarioResult => {
    const current = {
      revenue: metrics.reduce((sum, m) => sum + Number(m.monthly_revenue), 0),
      costs: metrics.reduce((sum, m) => sum + Number(m.monthly_conversion_costs) + Number(m.proportional_fixed_cost), 0),
      profit: metrics.reduce((sum, m) => sum + Number(m.monthly_profit), 0),
    };

    const newRevenue = current.revenue * (1 + percentageIncrease / 100);
    const newProfit = newRevenue - current.costs;

    return {
      currentRevenue: current.revenue,
      currentCosts: current.costs,
      currentProfit: current.profit,
      newRevenue,
      newCosts: current.costs,
      newProfit,
      difference: newProfit - current.profit,
      percentageChange: ((newProfit - current.profit) / current.profit) * 100,
    };
  };

  const simulateCostIncrease = (percentageIncrease: number): ScenarioResult => {
    const current = {
      revenue: metrics.reduce((sum, m) => sum + Number(m.monthly_revenue), 0),
      costs: metrics.reduce((sum, m) => sum + Number(m.monthly_conversion_costs) + Number(m.proportional_fixed_cost), 0),
      profit: metrics.reduce((sum, m) => sum + Number(m.monthly_profit), 0),
    };

    const newCosts = current.costs * (1 + percentageIncrease / 100);
    const newProfit = current.revenue - newCosts;

    return {
      currentRevenue: current.revenue,
      currentCosts: current.costs,
      currentProfit: current.profit,
      newRevenue: current.revenue,
      newCosts,
      newProfit,
      difference: newProfit - current.profit,
      percentageChange: current.profit !== 0 ? ((newProfit - current.profit) / current.profit) * 100 : 0,
    };
  };

  const simulateTargetMargin = (targetMarginPercentage: number) => {
    return metrics.map((metric) => {
      const totalCosts = Number(metric.monthly_conversion_costs) + Number(metric.proportional_fixed_cost);
      const requiredRevenue = totalCosts / (1 - targetMarginPercentage / 100);
      const suggestedPrice = Math.max(requiredRevenue, totalCosts * 1.1); // Mínimo 10% de margem

      return {
        pageId: metric.page_id,
        pageTitle: metric.page_title,
        currentPrice: Number(metric.monthly_rent_value),
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        currentMargin: Number(metric.profit_margin),
        targetMargin: targetMarginPercentage,
        increase: suggestedPrice - Number(metric.monthly_rent_value),
        percentageIncrease: ((suggestedPrice - Number(metric.monthly_rent_value)) / Number(metric.monthly_rent_value)) * 100,
      };
    });
  };

  return {
    simulatePriceIncrease,
    simulateCostIncrease,
    simulateTargetMargin,
  };
};
