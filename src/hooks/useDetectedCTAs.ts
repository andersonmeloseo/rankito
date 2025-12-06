import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DetectedCTA {
  cta_text: string;
  event_type: string;
  click_count: number;
  first_seen: string;
  last_seen: string;
}

export const useDetectedCTAs = (siteId: string) => {
  return useQuery({
    queryKey: ['detected-ctas', siteId],
    queryFn: async (): Promise<DetectedCTA[]> => {
      const { data, error } = await supabase
        .rpc('get_detected_ctas', { p_site_id: siteId });

      if (error) {
        console.error('Error fetching detected CTAs:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!siteId,
    staleTime: 60000, // 1 minute cache
  });
};
