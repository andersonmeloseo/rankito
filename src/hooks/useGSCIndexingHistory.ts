import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GSCIndexingHistoryFilters {
  status?: 'success' | 'failed' | 'pending';
  startDate?: string;
  endDate?: string;
  integrationId?: string;
  searchTerm?: string;
}

interface UseGSCIndexingHistoryParams {
  siteId: string;
  filters: GSCIndexingHistoryFilters;
  page: number;
  perPage: number;
}

export const useGSCIndexingHistory = ({ 
  siteId, 
  filters, 
  page, 
  perPage 
}: UseGSCIndexingHistoryParams) => {
  return useQuery({
    queryKey: ['gsc-indexing-history', siteId, filters, page, perPage],
    queryFn: async () => {
      let query = supabase
        .from('gsc_url_indexing_requests')
        .select(`
          *,
          integration:google_search_console_integrations!gsc_url_indexing_requests_integration_id_fkey(
            connection_name,
            google_email,
            site_id
          )
        `, { count: 'exact' })
        .eq('integration.site_id', siteId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status === 'success') {
        query = query.eq('status', 'success');
      } else if (filters.status === 'failed') {
        query = query.eq('status', 'failed');
      } else if (filters.status === 'pending') {
        query = query.eq('status', 'pending');
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.integrationId) {
        query = query.eq('integration_id', filters.integrationId);
      }

      if (filters.searchTerm) {
        query = query.ilike('url', `%${filters.searchTerm}%`);
      }

      // Pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        requests: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / perPage)
      };
    }
  });
};

export const useGSCIndexingStats = (siteId: string) => {
  return useQuery({
    queryKey: ['gsc-indexing-stats', siteId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayRequests, error: todayError } = await supabase
        .from('gsc_url_indexing_requests')
        .select(`
          *,
          integration:google_search_console_integrations!gsc_url_indexing_requests_integration_id_fkey(
            site_id
          )
        `)
        .eq('integration.site_id', siteId)
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      const total = todayRequests?.length || 0;
      const success = todayRequests?.filter(r => r.status === 'success').length || 0;
      const failed = todayRequests?.filter(r => r.status === 'failed').length || 0;
      const successRate = total > 0 ? (success / total) * 100 : 0;

      // Calculate average response time for completed requests
      const completedWithTimes = todayRequests?.filter(r => 
        r.status === 'success' && r.submitted_at && r.completed_at
      ) || [];
      
      const avgResponseTime = completedWithTimes.length > 0
        ? completedWithTimes.reduce((acc, r) => {
            const submitted = new Date(r.submitted_at!).getTime();
            const completed = new Date(r.completed_at!).getTime();
            return acc + (completed - submitted);
          }, 0) / completedWithTimes.length / 1000 // Convert to seconds
        : 0;

      return {
        todayTotal: total,
        todaySuccess: success,
        todayFailed: failed,
        successRate: Math.round(successRate),
        avgResponseTime: avgResponseTime.toFixed(1)
      };
    }
  });
};
