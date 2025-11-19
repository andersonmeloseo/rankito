import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseGSCIndexingJobsFilters {
  jobType?: string;
  status?: string;
  integrationId?: string;
}

export const useGSCIndexingJobs = (
  siteId: string,
  filters?: UseGSCIndexingJobsFilters
) => {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['gsc-indexing-jobs', siteId, filters],
    queryFn: async () => {
      let query = supabase
        .from('gsc_indexing_jobs')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.jobType && filters.jobType !== 'all') {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.integrationId) {
        query = query.eq('integration_id', filters.integrationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const { data: statistics } = useQuery({
    queryKey: ['gsc-indexing-jobs-stats', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_indexing_jobs')
        .select('job_type, status, urls_successful, urls_failed')
        .eq('site_id', siteId);

      if (error) throw error;

      const stats = {
        total: data.length,
        completed: data.filter(j => j.status === 'completed').length,
        failed: data.filter(j => j.status === 'failed').length,
        running: data.filter(j => j.status === 'running').length,
        totalUrlsProcessed: data.reduce((sum, j) => sum + (j.urls_successful || 0), 0),
        totalUrlsFailed: data.reduce((sum, j) => sum + (j.urls_failed || 0), 0),
      };

      return stats;
    },
    enabled: !!siteId,
  });

  return {
    jobs,
    statistics,
    isLoading,
  };
};
