import { useState } from "react";

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface TimeRangeConfig {
  value: TimeRange;
  label: string;
  hours: number;
}

export const timeRanges: TimeRangeConfig[] = [
  { value: '1h', label: 'Última Hora', hours: 1 },
  { value: '24h', label: 'Últimas 24h', hours: 24 },
  { value: '7d', label: 'Últimos 7 Dias', hours: 168 },
  { value: '30d', label: 'Últimos 30 Dias', hours: 720 },
];

export const useGSCTimeRange = (defaultRange: TimeRange = '24h') => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  const config = timeRanges.find(r => r.value === timeRange) || timeRanges[1];

  const getStartDate = () => {
    const now = new Date();
    now.setHours(now.getHours() - config.hours);
    return now;
  };

  return {
    timeRange,
    setTimeRange,
    config,
    startDate: getStartDate(),
    endDate: new Date(),
  };
};
