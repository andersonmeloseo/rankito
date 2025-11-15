import { format, subHours, startOfHour } from 'date-fns';

export interface HourlyData {
  hour: string;
  google: number;
  indexnow: number;
  successRate: number;
}

export interface QuotaHistoryData {
  date: string;
  used: number;
  limit: number;
  percentage: number;
}

export interface SitemapIndexationData {
  name: string;
  submitted: number;
  indexed: number;
  rate: number;
}

export const generateHourlyData = (hours: number = 24): HourlyData[] => {
  const data: HourlyData[] = [];
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const hourDate = subHours(startOfHour(now), i);
    const hourLabel = format(hourDate, 'HH:mm');
    
    // Simular dados (em produção viriam do backend)
    data.push({
      hour: hourLabel,
      google: Math.floor(Math.random() * 30) + 10,
      indexnow: Math.floor(Math.random() * 10) + 2,
      successRate: 95 + Math.random() * 5,
    });
  }

  return data;
};

export const generateQuotaHistory = (days: number = 7): QuotaHistoryData[] => {
  const data: QuotaHistoryData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateLabel = format(date, 'dd/MM');
    
    const limit = 200;
    const used = Math.floor(Math.random() * 150) + 50;
    
    data.push({
      date: dateLabel,
      used,
      limit,
      percentage: (used / limit) * 100,
    });
  }

  return data;
};

export const calculateTrend = (current: number, previous: number): {
  value: number;
  percentage: number;
  isPositive: boolean;
} => {
  if (previous === 0) return { value: 0, percentage: 0, isPositive: true };
  
  const diff = current - previous;
  const percentage = (diff / previous) * 100;
  
  return {
    value: diff,
    percentage,
    isPositive: diff >= 0,
  };
};

export const formatTrendText = (trend: ReturnType<typeof calculateTrend>): string => {
  const sign = trend.isPositive ? '+' : '';
  return `${sign}${trend.percentage.toFixed(1)}%`;
};
