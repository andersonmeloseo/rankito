import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QueueExecutionLog {
  id: string;
  executed_at: string;
  total_processed: number;
  total_failed: number;
  total_skipped: number;
  duration_ms: number;
  error_message: string | null;
  execution_type: 'cron' | 'manual';
}

export function useGSCQueueLogs() {
  // Fetch latest execution log
  const { data: latestLog, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['gsc-queue-latest-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_queue_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as QueueExecutionLog | null;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch execution history (last 20 logs)
  const { data: executionHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['gsc-queue-execution-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_queue_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as QueueExecutionLog[];
    },
    refetchInterval: 30000,
  });

  // Calculate next execution (every 30 minutes from last execution)
  const nextExecution = latestLog ? 
    new Date(new Date(latestLog.executed_at).getTime() + 30 * 60 * 1000) : null;

  return {
    latestLog,
    executionHistory: executionHistory || [],
    nextExecution,
    isLoading: isLoadingLatest || isLoadingHistory,
  };
}
