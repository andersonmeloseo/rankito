import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { subDays, format } from 'date-fns';
import { Currency, ReportLocale } from '@/i18n/reportTranslations';

export interface FinancialData {
  costPerConversion: number;
  currency: Currency;
  locale: ReportLocale;
  totalValue: number;
  previousTotalValue?: number;
  valueChange?: number;
}

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  previousPeriod?: {
    start: string;
    end: string;
  };
  summary: {
    totalConversions: number;
    totalPageViews: number;
    conversionRate: number;
    averageROI: number;
  };
  previousSummary?: {
    totalConversions: number;
    totalPageViews: number;
    conversionRate: number;
    averageROI: number;
  };
  comparison?: {
    conversionsChange: number;
    pageViewsChange: number;
    conversionRateChange: number;
    roiChange: number;
  };
  financial?: FinancialData;
  conversionsTimeline: Array<{
    date: string;
    count: number;
  }>;
  previousConversionsTimeline?: Array<{
    date: string;
    count: number;
  }>;
  pageViewsTimeline: Array<{
    date: string;
    views: number;
    conversions: number;
    conversionRate: number;
  }>;
  conversionHeatmap: Record<string, number>;
  topPages: Array<{
    page: string;
    conversions: number;
    pageViews: number;
    conversionRate: number;
  }>;
  conversionTypes: Array<{
    type: string;
    count: number;
  }>;
  referrers: Array<{
    referrer: string;
    count: number;
  }>;
  funnelData: {
    pageViews: number;
    interactions: number;
    conversions: number;
  };
  bubbleData: Array<{
    name: string;
    pageViews: number;
    conversions: number;
    conversionRate: number;
  }>;
  radarData: Array<{
    metric: string;
    value: number;
    fullMark: number;
  }>;
  insights: string[];
  ecommerce?: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{
      name: string;
      views: number;
      addToCarts: number;
      purchases: number;
      revenue: number;
    }>;
    funnel: {
      productViews: number;
      addToCarts: number;
      checkouts: number;
      purchases: number;
    };
  };
}

export const useReportData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const fetchReportData = async (
    siteId: string, 
    periodDays: number, 
    enableComparison: boolean = false,
    financialConfig?: { costPerConversion: number; currency: Currency; locale: ReportLocale }
  ) => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = periodDays === -1 ? new Date('2000-01-01') : subDays(endDate, periodDays);

      const { data: conversions, error: convError } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .eq('site_id', siteId)
        .neq('event_type', 'page_view')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (convError) throw convError;

      const { data: pageMetrics, error: pageError } = await supabase
        .from('rank_rent_page_metrics')
        .select('*')
        .eq('site_id', siteId);

      if (pageError) throw pageError;

      // Fetch e-commerce events
      const { data: ecommerceEvents } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_ecommerce_event', true)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalConversions = conversions?.length || 0;
      const totalPageViews = pageMetrics?.reduce((sum, p) => sum + (Number(p.total_page_views) || 0), 0) || 0;
      const conversionRate = totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0;

      const conversionsByDate = conversions?.reduce((acc, conv) => {
        const date = format(new Date(conv.created_at), 'dd/MM');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const conversionsTimeline = Object.entries(conversionsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => {
          const [dayA, monthA] = a.date.split('/').map(Number);
          const [dayB, monthB] = b.date.split('/').map(Number);
          return monthA !== monthB ? monthA - monthB : dayA - dayB;
        });

      const allDates = new Set([...Object.keys(conversionsByDate)]);
      const pageViewsTimeline = Array.from(allDates).map(date => {
        const convCount = conversionsByDate[date] || 0;
        const viewsEstimate = Math.round(convCount * (totalPageViews / Math.max(totalConversions, 1)));
        return {
          date,
          views: viewsEstimate,
          conversions: convCount,
          conversionRate: viewsEstimate > 0 ? (convCount / viewsEstimate) * 100 : 0
        };
      }).sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA !== monthB ? monthA - monthB : dayA - dayB;
      });

      const conversionHeatmap: Record<string, number> = {};
      conversions?.forEach(conv => {
        const date = new Date(conv.created_at);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;
        conversionHeatmap[key] = (conversionHeatmap[key] || 0) + 1;
      });

      // Todas as páginas (sem limite)
      const topPages = (pageMetrics || [])
        .map(p => ({
          page: p.page_title || p.page_path || 'Sem título',
          conversions: Number(p.total_conversions) || 0,
          pageViews: Number(p.total_page_views) || 0,
          conversionRate: Number(p.conversion_rate) || 0
        }))
        .sort((a, b) => b.conversions - a.conversions);

      const conversionTypes = conversions?.reduce((acc, conv) => {
        const type = conv.event_type || 'Outros';
        const existing = acc.find(t => t.type === type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type, count: 1 });
        }
        return acc;
      }, [] as Array<{ type: string; count: number }>) || [];

      const referrers = conversions?.reduce((acc, conv) => {
        const ref = conv.referrer || 'Direto';
        const existing = acc.find(r => r.referrer === ref);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ referrer: ref, count: 1 });
        }
        return acc;
      }, [] as Array<{ referrer: string; count: number }>) || [];

      // Dados do funil
      const funnelData = {
        pageViews: totalPageViews,
        interactions: Math.round(totalConversions * 1.5), // Estimativa
        conversions: totalConversions
      };

      // Dados para bubble chart (top 20 páginas)
      const bubbleData = topPages.slice(0, 20).map(p => ({
        name: p.page.length > 30 ? p.page.substring(0, 30) + '...' : p.page,
        pageViews: p.pageViews,
        conversions: p.conversions,
        conversionRate: p.conversionRate
      }));

      // Dados para radar chart
      const avgConversionRate = topPages.reduce((sum, p) => sum + p.conversionRate, 0) / Math.max(topPages.length, 1);
      const maxPageViews = Math.max(...topPages.map(p => p.pageViews), 1);
      const maxConversions = Math.max(...topPages.map(p => p.conversions), 1);
      
      const radarData = [
        { 
          metric: 'Volume de Tráfego', 
          value: Math.min((totalPageViews / (maxPageViews * 0.1)) * 100, 100),
          fullMark: 100 
        },
        { 
          metric: 'Taxa de Conversão', 
          value: Math.min(conversionRate * 10, 100),
          fullMark: 100 
        },
        { 
          metric: 'Engajamento', 
          value: Math.min((totalConversions / (maxConversions * 0.1)) * 100, 100),
          fullMark: 100 
        },
        { 
          metric: 'Diversidade de Páginas', 
          value: Math.min((topPages.length / 50) * 100, 100),
          fullMark: 100 
        },
        { 
          metric: 'Consistência', 
          value: Math.min((avgConversionRate / conversionRate) * 100, 100),
          fullMark: 100 
        }
      ];

      // Gera insights automáticos
      const insights: string[] = [];
      
      if (conversionRate > 5) {
        insights.push(`✨ Taxa de conversão acima da média (${conversionRate.toFixed(2)}%)`);
      } else if (conversionRate < 2) {
        insights.push(`⚠️ Taxa de conversão baixa (${conversionRate.toFixed(2)}%) - Considere otimizar CTAs`);
      }

      if (totalConversions > 100) {
        insights.push(`🎯 Volume saudável de conversões (${totalConversions})`);
      }

      const topPerformer = topPages[0];
      if (topPerformer && topPerformer.conversionRate > avgConversionRate * 1.5) {
        insights.push(`🏆 Página destaque: "${topPerformer.page}" com ${topPerformer.conversionRate.toFixed(1)}% de conversão`);
      }

      const lowPerformers = topPages.filter(p => p.conversionRate < avgConversionRate * 0.5).length;
      if (lowPerformers > topPages.length * 0.3) {
        insights.push(`📉 ${lowPerformers} páginas com performance abaixo da média - Oportunidade de melhoria`);
      }

      if (topPages.length > 20) {
        insights.push(`📚 Portfólio diversificado com ${topPages.length} páginas ativas`);
      }

      const data: ReportData = {
        period: {
          start: format(startDate, 'dd/MM/yyyy'),
          end: format(endDate, 'dd/MM/yyyy')
        },
        summary: {
          totalConversions,
          totalPageViews,
          conversionRate,
          averageROI: 0
        },
        conversionsTimeline,
        pageViewsTimeline,
        conversionHeatmap,
        topPages,
        conversionTypes,
        referrers: referrers.sort((a, b) => b.count - a.count).slice(0, 10),
        funnelData,
        bubbleData,
        radarData,
        insights
      };

      if (financialConfig) {
        const totalValue = financialConfig.costPerConversion * totalConversions;
        data.financial = {
          costPerConversion: financialConfig.costPerConversion,
          currency: financialConfig.currency,
          locale: financialConfig.locale,
          totalValue
        };
      }

      // Process e-commerce data
      if (ecommerceEvents && ecommerceEvents.length > 0) {
        const productMap = new Map();
        
        ecommerceEvents.forEach(event => {
          const metadata = event.metadata as any;
          const productId = metadata?.product_id || 'unknown';
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              name: metadata?.product_name || productId,
              views: 0,
              addToCarts: 0,
              purchases: 0,
              revenue: 0
            });
          }
          const product = productMap.get(productId);
          if (event.event_type === 'product_view') product.views++;
          if (event.event_type === 'add_to_cart') product.addToCarts++;
          if (event.event_type === 'purchase') {
            product.purchases++;
            product.revenue += parseFloat(metadata?.revenue || '0');
          }
        });

        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue);

        const purchases = ecommerceEvents.filter(e => e.event_type === 'purchase');
        const totalRevenue = purchases.reduce((sum, p) => {
          const metadata = p.metadata as any;
          return sum + parseFloat(metadata?.revenue || '0');
        }, 0);
        const totalOrders = purchases.length;

        data.ecommerce = {
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          topProducts,
          funnel: {
            productViews: ecommerceEvents.filter(e => e.event_type === 'product_view').length,
            addToCarts: ecommerceEvents.filter(e => e.event_type === 'add_to_cart').length,
            checkouts: ecommerceEvents.filter(e => e.event_type === 'begin_checkout').length,
            purchases: totalOrders
          }
        };
      }

      setReportData(data);
      
      toast({
        title: "Preview gerado com sucesso!",
        description: "Os dados foram carregados e processados.",
      });
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Erro ao gerar preview",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { reportData, loading, fetchReportData };
};
