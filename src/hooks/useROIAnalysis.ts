import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";

interface UseROIAnalysisParams {
  siteId: string;
  periodDays: number;
}

export const useROIAnalysis = ({ siteId, periodDays }: UseROIAnalysisParams) => {
  const [costPerConversion, setCostPerConversion] = useState<number>(10);

  // Carregar custo por conversão do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`roi_cost_per_conversion_${siteId}`);
    if (saved) {
      setCostPerConversion(parseFloat(saved));
    }
  }, [siteId]);

  // Salvar custo por conversão no localStorage
  const updateCostPerConversion = (value: number) => {
    setCostPerConversion(value);
    localStorage.setItem(`roi_cost_per_conversion_${siteId}`, String(value));
  };

  // Buscar dados do site
  const { data: siteData, isLoading: isLoadingSite } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_rent_sites")
        .select("site_name, monthly_rent_value")
        .eq("id", siteId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar conversões do período
  const { data: conversionsData, isLoading: isLoadingConversions } = useQuery({
    queryKey: ["roi-conversions", siteId, periodDays],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("rank_rent_conversions")
        .select("id, created_at")
        .eq("site_id", siteId)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Calcular métricas de ROI
  const calculatedROI = useMemo(() => {
    if (!siteData?.monthly_rent_value || !conversionsData) {
      return null;
    }

    const monthlyRentValue = siteData.monthly_rent_value;
    const conversionsCount = conversionsData.length;

    // Receita proporcional ao período
    const proportionalRevenue = (monthlyRentValue / 30) * periodDays;

    // Custo total das conversões
    const totalCost = conversionsCount * costPerConversion;

    // Resultado líquido
    const netResult = proportionalRevenue - totalCost;

    // É lucro ou prejuízo?
    const isProfit = netResult > 0;

    // Percentual de margem
    const profitPercentage = totalCost > 0 ? (netResult / totalCost) * 100 : 0;

    // Projeção mensal (30 dias)
    const monthlyProjection = (netResult / periodDays) * 30;

    // Percentual do mês que o período representa
    const periodPercentage = (periodDays / 30) * 100;

    return {
      periodDays,
      periodPercentage,
      proportionalRevenue,
      totalCost,
      netResult,
      isProfit,
      profitPercentage,
      monthlyProjection,
      conversionsCount,
      monthlyRentValue,
    };
  }, [siteData, conversionsData, costPerConversion, periodDays]);

  return {
    siteData,
    conversionsData,
    costPerConversion,
    setCostPerConversion: updateCostPerConversion,
    calculatedROI,
    isLoading: isLoadingSite || isLoadingConversions,
  };
};
