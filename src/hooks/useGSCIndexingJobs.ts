import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IndexingJob {
  id: string;
  site_id: string;
  integration_id: string | null;
  job_type: 'manual' | 'scheduled' | 'discovery';
  status: 'queued' | 'running' | 'completed' | 'failed';
  urls_processed: number;
  urls_successful: number;
  urls_failed: number;
  results: any;
  error_details: string | null;
  error_type: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface UseGSCIndexingJobsParams {
  siteId: string | null;
  limit?: number;
  jobType?: 'manual' | 'scheduled' | 'discovery';
  status?: 'queued' | 'running' | 'completed' | 'failed';
}

export function useGSCIndexingJobs({
  siteId,
  limit = 50,
  jobType,
  status,
}: UseGSCIndexingJobsParams) {
  return useQuery({
    queryKey: ['gsc-indexing-jobs', siteId, jobType, status, limit],
    queryFn: async () => {
      if (!siteId) return [];

      console.log('🔍 Fetching indexing jobs for site:', siteId);

      let query = supabase
        .from('gsc_indexing_jobs' as any)
        .select(`
          *,
          google_search_console_integrations(connection_name, google_email)
        `)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (jobType) {
        query = query.eq('job_type', jobType);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching indexing jobs:', error);
        throw error;
      }

      console.log('✅ Indexing jobs fetched:', data?.length || 0);
      return (data || []) as unknown as IndexingJob[];
    },
    enabled: !!siteId,
    refetchInterval: 30000, // Refetch a cada 30s
  });
}
