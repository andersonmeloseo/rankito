import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MapboxUsageResponse {
  canLoad: boolean;
  currentCount: number;
  limit: number;
  limitReached: boolean;
  resetDate: string;
}

export const useMapboxUsage = () => {
  return useQuery({
    queryKey: ['mapbox-usage'],
    queryFn: async (): Promise<MapboxUsageResponse> => {
      const { data, error } = await supabase.functions.invoke('mapbox-track-usage', {
        method: 'POST',
      });

      if (error) {
        console.error('[useMapboxUsage] Error:', error);
        throw error;
      }

      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
