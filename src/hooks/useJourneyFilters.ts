import { useState, useMemo } from 'react';
import type { CommonSequence } from './useSessionAnalytics';

export interface JourneyFilters {
  limit: number | 'all';
  minPages: number;
  minPercentage: number;
  locationFilter: string;
  conversionFilter: 'all' | 'converted' | 'not_converted';
  dateRange: { start: Date; end: Date };
}

export const useJourneyFilters = (sequences: CommonSequence[]) => {
  const [limit, setLimit] = useState<number | 'all'>(10);
  const [minPages, setMinPages] = useState<number>(1);
  const [minPercentage, setMinPercentage] = useState<number>(0);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [conversionFilter, setConversionFilter] = useState<'all' | 'converted' | 'not_converted'>('all');

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
  };

  const isFiltered = limit !== 10 || minPages !== 1 || minPercentage !== 0 || 
                     locationFilter !== 'all' || conversionFilter !== 'all';

  return {
    // State
    limit,
    minPages,
    minPercentage,
    locationFilter,
    conversionFilter,
    
    // Setters
    setLimit,
    setMinPages,
    setMinPercentage,
    setLocationFilter,
    setConversionFilter,
    
    // Computed
    filteredSequences,
    uniqueLocations,
    isFiltered,
    
    // Actions
    handleReset,
  };
};
