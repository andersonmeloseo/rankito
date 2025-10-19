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

      // Fetch conversions
      const { data: conversions, error: convError } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (convError) throw convError;

      // Fetch page metrics
      const { data: pageMetrics, error: pageError } = await supabase
        .from('rank_rent_page_metrics')
        .select('*')
        .eq('site_id', siteId);

      if (pageError) throw pageError;

      // Process data
      const totalConversions = conversions?.length || 0;
      const totalPageViews = pageMetrics?.reduce((sum, p) => sum + (Number(p.total_page_views) || 0), 0) || 0;
      const conversionRate = totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0;

      // Group conversions by date
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

      // Top pages
      const topPages = (pageMetrics || [])
        .map(p => ({
          page: p.page_title || p.page_path || 'Sem título',
          conversions: Number(p.total_conversions) || 0,
          pageViews: Number(p.total_page_views) || 0,
          conversionRate: Number(p.conversion_rate) || 0
        }))
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 10);

      // Conversion types
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

      // Referrers
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
        topPages,
        conversionTypes,
        referrers: referrers.sort((a, b) => b.count - a.count).slice(0, 10)
      };

      // Add financial data if config provided
      if (financialConfig) {
        const totalValue = financialConfig.costPerConversion * totalConversions;
        data.financial = {
          costPerConversion: financialConfig.costPerConversion,
          currency: financialConfig.currency,
          locale: financialConfig.locale,
          totalValue
        };
      }

      // Fetch comparison data if enabled
      if (enableComparison && periodDays !== -1) {
        const previousEndDate = subDays(startDate, 1);
        const previousStartDate = subDays(previousEndDate, periodDays);

        // Fetch previous period conversions
        const { data: previousConversions, error: prevConvError } = await supabase
          .from('rank_rent_conversions')
          .select('*')
          .eq('site_id', siteId)
          .gte('created_at', previousStartDate.toISOString())
          .lte('created_at', previousEndDate.toISOString());

        if (prevConvError) throw prevConvError;

        // Process previous period data
        const prevTotalConversions = previousConversions?.length || 0;
        const prevTotalPageViews = pageMetrics?.reduce((sum, p) => sum + (Number(p.total_page_views) || 0), 0) || 0;
        const prevConversionRate = prevTotalPageViews > 0 ? (prevTotalConversions / prevTotalPageViews) * 100 : 0;

        // Calculate percentage changes
        const conversionsChange = prevTotalConversions > 0
          ? ((totalConversions - prevTotalConversions) / prevTotalConversions) * 100
          : totalConversions > 0 ? 100 : 0;

        const pageViewsChange = prevTotalPageViews > 0
          ? ((totalPageViews - prevTotalPageViews) / prevTotalPageViews) * 100
          : totalPageViews > 0 ? 100 : 0;

        const conversionRateChange = conversionRate - prevConversionRate;

        // Group previous conversions by date
        const prevConversionsByDate = previousConversions?.reduce((acc, conv) => {
          const date = format(new Date(conv.created_at), 'dd/MM');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const previousConversionsTimeline = Object.entries(prevConversionsByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => {
            const [dayA, monthA] = a.date.split('/').map(Number);
            const [dayB, monthB] = b.date.split('/').map(Number);
            return monthA !== monthB ? monthA - monthB : dayA - dayB;
          });

        // Add comparison data
        data.previousPeriod = {
          start: format(previousStartDate, 'dd/MM/yyyy'),
          end: format(previousEndDate, 'dd/MM/yyyy')
        };
        data.previousSummary = {
          totalConversions: prevTotalConversions,
          totalPageViews: prevTotalPageViews,
          conversionRate: prevConversionRate,
          averageROI: 0
        };
        data.comparison = {
          conversionsChange,
          pageViewsChange,
          conversionRateChange,
          roiChange: 0
        };
        data.previousConversionsTimeline = previousConversionsTimeline;

        // Update financial data with comparison if config provided
        if (financialConfig && data.financial) {
          const previousTotalValue = financialConfig.costPerConversion * prevTotalConversions;
          const valueChange = previousTotalValue > 0
            ? ((data.financial.totalValue - previousTotalValue) / previousTotalValue) * 100
            : data.financial.totalValue > 0 ? 100 : 0;

          data.financial.previousTotalValue = previousTotalValue;
          data.financial.valueChange = valueChange;
        }
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
