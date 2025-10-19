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
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (convError) throw convError;

      const { data: pageMetrics, error: pageError } = await supabase
        .from('rank_rent_page_metrics')
        .select('*')
        .eq('site_id', siteId);

      if (pageError) throw pageError;

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

      const topPages = (pageMetrics || [])
        .map(p => ({
          page: p.page_title || p.page_path || 'Sem título',
          conversions: Number(p.total_conversions) || 0,
          pageViews: Number(p.total_page_views) || 0,
          conversionRate: Number(p.conversion_rate) || 0
        }))
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 10);

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
        referrers: referrers.sort((a, b) => b.count - a.count).slice(0, 10)
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
