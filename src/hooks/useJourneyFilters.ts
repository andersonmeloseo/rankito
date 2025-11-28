import { useState, useMemo } from 'react';
import type { CommonSequence } from './useSessionAnalytics';

export interface JourneyFilters {
  limit: number | 'all';
  minPages: number;
  minPercentage: number;
  locationFilter: string;
  conversionFilter: 'all' | 'converted' | 'not_converted';
  dateRange: { start: Date; end: Date };
  periodDays: number;
}

export const useJourneyFilters = (sequences: CommonSequence[]) => {
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [minPages, setMinPages] = useState<number>(1);
  const [minPercentage, setMinPercentage] = useState<number>(0);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [conversionFilter, setConversionFilter] = useState<'all' | 'converted' | 'not_converted'>('all');
  const [periodDays, setPeriodDays] = useState<number>(90); // 3 meses padrão
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    return { start, end };
  });

  // Extract unique locations from sequences
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    sequences.forEach(seq => {
      seq.locations.forEach(loc => {
        locations.add(`${loc.city}, ${loc.country}`);
      });
    });
    return Array.from(locations).sort();
  }, [sequences]);

  // Apply all filters
  const filteredSequences = useMemo(() => {
    let filtered = sequences
      .filter(seq => seq.pageCount >= minPages)
      .filter(seq => seq.percentage >= minPercentage);
    
    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(seq => 
        seq.locations.some(loc => `${loc.city}, ${loc.country}` === locationFilter)
      );
    }

    // Conversion filter
    if (conversionFilter === 'converted') {
      filtered = filtered.filter(seq => seq.sessionsWithClicks > 0);
    } else if (conversionFilter === 'not_converted') {
      filtered = filtered.filter(seq => seq.sessionsWithClicks === 0);
    }
    
    // Limit
    if (limit !== 'all') {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [sequences, limit, minPages, minPercentage, locationFilter, conversionFilter]);

  const handleReset = () => {
    setLimit(10);
    setMinPages(1);
    setMinPercentage(0);
    setLocationFilter('all');
    setConversionFilter('all');
    setPeriodDays(90);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    setDateRange({ start, end });
  };

  const isFiltered = limit !== 10 || minPages !== 1 || minPercentage !== 0 || 
                     locationFilter !== 'all' || conversionFilter !== 'all' || periodDays !== 90;

  return {
    // State
    limit,
    minPages,
    minPercentage,
    locationFilter,
    conversionFilter,
    periodDays,
    dateRange,
    
    // Setters
    setLimit,
    setMinPages,
    setMinPercentage,
    setLocationFilter,
    setConversionFilter,
    setPeriodDays,
    setDateRange,
    
    // Computed
    filteredSequences,
    uniqueLocations,
    isFiltered,
    
    // Actions
    handleReset,
  };
};
