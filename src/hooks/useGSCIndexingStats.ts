import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IndexingStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
  avgResponseTime: number;
}

export function useGSCIndexingStats(siteId: string | null) {
  return useQuery({
    queryKey: ['gsc-indexing-stats', siteId],
    queryFn: async (): Promise<IndexingStats> => {
      if (!siteId) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
          avgResponseTime: 0,
        };
      }

      // Get all integrations for this site
      const { data: integrations } = await supabase
        .from('google_search_console_integrations')
        .select('id')
        .eq('site_id', siteId)
        .eq('is_active', true);

      if (!integrations || integrations.length === 0) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
          avgResponseTime: 0,
        };
      }

      const integrationIds = integrations.map(i => i.id);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch today's requests
      const { data: requests, error } = await supabase
        .from('gsc_url_indexing_requests')
        .select('status, submitted_at, completed_at')
        .in('integration_id', integrationIds)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) {
        console.error('Error fetching indexing stats:', error);
        return {
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
          avgResponseTime: 0,
        };
      }

      const total = requests?.length || 0;
      const success = requests?.filter(r => r.status === 'success').length || 0;
      const failed = requests?.filter(r => r.status === 'error').length || 0;
      const pending = requests?.filter(r => r.status === 'pending').length || 0;
      const successRate = total > 0 ? (success / total) * 100 : 0;

      // Calculate average response time for successful requests
      const successfulWithTimes = requests?.filter(r => 
        r.status === 'success' && r.submitted_at && r.completed_at
      ) || [];
      
      let avgResponseTime = 0;
      if (successfulWithTimes.length > 0) {
        const totalTime = successfulWithTimes.reduce((sum, r) => {
          const submitted = new Date(r.submitted_at!).getTime();
          const completed = new Date(r.completed_at!).getTime();
          return sum + (completed - submitted);
        }, 0);
        avgResponseTime = totalTime / successfulWithTimes.length / 1000; // Convert to seconds
      }

      return {
        total,
        success,
        failed,
        pending,
        successRate,
        avgResponseTime,
      };
    },
    enabled: !!siteId,
    refetchInterval: 10000,
  });
}
