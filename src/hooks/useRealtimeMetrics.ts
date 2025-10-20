import { useMemo } from 'react';

interface Conversion {
  created_at: string;
  event_type: string;
}

interface Analytics {
  totalConversions: number;
  conversionRate: number;
  pageViews: number;
}

interface LiveMetrics {
  totalConversions: number;
  conversionRate: number;
  conversionsPerHour: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastConversionTime: string | null;
}

export const useRealtimeMetrics = (
  analytics: Analytics | null,
  newConversions: Conversion[]
): LiveMetrics => {
  const liveMetrics = useMemo(() => {
    if (!analytics) {
      return {
        totalConversions: 0,
        conversionRate: 0,
        conversionsPerHour: 0,
        trendDirection: 'stable' as const,
        lastConversionTime: null,
      };
    }

    const totalConversions = analytics.totalConversions + newConversions.length;
    const pageViews = analytics.pageViews;
    const conversionRate = pageViews > 0 ? (totalConversions / pageViews) * 100 : 0;

    // Calcular conversões por hora (baseado nas últimas conversões)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const conversionsLastHour = newConversions.filter((c) => {
      const conversionTime = new Date(c.created_at);
      return conversionTime >= oneHourAgo;
    }).length;

    // Determinar tendência
    const baseRate = analytics.conversionRate;
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    
    if (conversionRate > baseRate * 1.1) {
      trendDirection = 'up';
    } else if (conversionRate < baseRate * 0.9) {
      trendDirection = 'down';
    }

    const lastConversionTime = newConversions.length > 0 
      ? newConversions[0].created_at 
      : null;

    return {
      totalConversions,
      conversionRate,
      conversionsPerHour: conversionsLastHour,
      trendDirection,
      lastConversionTime,
    };
  }, [analytics, newConversions]);

  return liveMetrics;
};