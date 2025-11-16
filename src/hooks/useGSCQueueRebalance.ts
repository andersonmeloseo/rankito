import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCSmartDistribution } from './useGSCSmartDistribution';
import { useGSCAggregatedQuota } from './useGSCAggregatedQuota';
import { previewDistribution, type Integration, type DistributionPreview } from '@/lib/gsc-distribution-engine';
import { createLogger, Logger } from '@/lib/logger';

const logger = createLogger({ operation: 'queue-rebalance' });

interface RebalanceResult {
  message: string;
  urlsRebalanced: number;
}

export interface RebalancePreview extends DistributionPreview {}

export function useGSCQueueRebalance(siteId: string) {
  const queryClient = useQueryClient();
  const { distributeUrls } = useGSCSmartDistribution(siteId);
  const { data: quotaData } = useGSCAggregatedQuota(siteId);

  const previewRebalance = async (): Promise<RebalancePreview | null> => {
    const log = logger.child({ siteId, operation: 'preview' });
    log.info('Gerando preview');

    const { data: queueItems, error } = await supabase
      .from('gsc_indexing_queue')
      .select('id, url, page_id')
      .eq('status', 'pending');

    if (error || !queueItems?.length || !quotaData?.integrations) return null;

    const integrations: Integration[] = quotaData.integrations
      .filter(i => i.is_active && (i.health_status === 'healthy' || !i.health_status))
      .map(i => ({
        integration_id: i.integration_id,
        name: i.name,
        email: i.email,
        remaining_today: i.remaining_today,
        daily_limit: i.daily_limit,
        is_active: i.is_active,
        health_status: i.health_status,
        consecutive_failures: i.consecutive_failures || 0,
      }));

    if (!integrations.length) return null;

    return previewDistribution(queueItems.map(i => ({ url: i.url, page_id: i.page_id })), integrations, 'greedy');
  };

  const rebalanceQueue = useMutation({
    mutationFn: async (siteId: string): Promise<RebalanceResult> => {
      const correlationId = Logger.generateCorrelationId();
      const log = logger.child({ correlationId, siteId });

      const { data: queueItems, error } = await supabase
        .from('gsc_indexing_queue')
        .select('id, url, page_id')
        .eq('status', 'pending');

      if (error) throw new Error(error.message);
      if (!queueItems?.length) throw new Error('Nenhuma URL pendente');

      // FASE 1: Marcar como rebalancing
      await supabase.from('gsc_indexing_queue').update({ status: 'rebalancing' }).in('id', queueItems.map(i => i.id));

      try {
        // FASE 2: Redistribuir
        distributeUrls({ siteId, urls: queueItems.map(i => ({ url: i.url, page_id: i.page_id })) });
        
        // FASE 3A: Deletar antigas
        await supabase.from('gsc_indexing_queue').delete().eq('status', 'rebalancing');
        
        return { message: `${queueItems.length} URLs rebalanceadas`, urlsRebalanced: queueItems.length };
      } catch (err: any) {
        // FASE 3B: Reverter
        await supabase.from('gsc_indexing_queue').update({ status: 'pending' }).eq('status', 'rebalancing');
        throw new Error(err.message);
      }
    },
    onSuccess: (result) => {
      toast.success('Fila Rebalanceada! 🎯', { description: result.message });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao rebalancear', { description: error.message });
    },
  });

  return {
    rebalanceQueue: rebalanceQueue.mutate,
    isRebalancing: rebalanceQueue.isPending,
    previewRebalance,
  };
}
