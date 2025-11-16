import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCAggregatedQuota } from './useGSCAggregatedQuota';
import { distributeUrls, validateDistribution, type Integration } from '@/lib/gsc-distribution-engine';
import { createLogger, Logger } from '@/lib/logger';

const logger = createLogger({ operation: 'smart-distribution' });

interface DistributeUrlsParams {
  siteId: string;
  urls: Array<{ url: string; page_id?: string }>;
}

interface DistributionResult {
  success: boolean;
  total_urls: number;
  queued_urls: number;
  skipped_urls: number;
  distribution: Record<string, number>;
  message: string;
  days_needed: number;
}

/**
 * Hook para distribuição inteligente de URLs entre integrações GSC
 * Usa engine centralizado para distribuição consistente
 */
export function useGSCSmartDistribution(siteId: string) {
  const queryClient = useQueryClient();
  const { data: quota } = useGSCAggregatedQuota(siteId);

  const distributeUrlsMutation = useMutation({
    mutationFn: async ({ siteId, urls }: DistributeUrlsParams): Promise<DistributionResult> => {
      const correlationId = Logger.generateCorrelationId();
      const log = logger.child({ correlationId, siteId });

      log.info(`Iniciando distribuição: ${urls.length} URLs`);

      // Validar distribuição
      const validation = validateDistribution(urls, quota.integrations);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Converter integrações para formato do engine
      const integrations: Integration[] = quota.integrations
        .filter(i => i.is_active && (i.health_status === 'healthy' || i.health_status === null))
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

      // Executar distribuição usando engine
      const result = distributeUrls(urls, integrations, 'greedy');

      log.info(`Distribuição calculada: ${result.queueItems.length} URLs em ${result.daysNeeded} dias`);

      // Inserir em lote na fila
      const { error: insertError } = await supabase
        .from('gsc_indexing_queue')
        .insert(result.queueItems);

      if (insertError) {
        log.error('Erro ao inserir na fila', insertError);
        throw new Error(`Erro ao adicionar URLs à fila: ${insertError.message}`);
      }

      log.info('Distribuição concluída com sucesso');

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-load-distribution', siteId] });

      return {
        success: true,
        total_urls: urls.length,
        queued_urls: result.queueItems.length,
        skipped_urls: 0,
        distribution: result.distribution,
        days_needed: result.daysNeeded,
        message: result.daysNeeded === 1 
          ? `${urls.length} URLs agendadas para HOJE usando ${Object.keys(result.distribution).length} contas`
          : `${urls.length} URLs distribuídas inteligentemente em ${result.daysNeeded} dia(s)`,
      };
    },
    onSuccess: (result) => {
      const distributionDetails = Object.entries(result.distribution)
        .map(([name, count]) => `• ${name}: ${count} URLs`)
        .join('\n');

      const description = `📊 Distribuição por conta:\n${distributionDetails}\n\n⏰ URLs serão enviadas em ${result.days_needed} dia(s)`;

      toast.success(result.message, {
        description,
        duration: 8000,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro na distribuição de URLs', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  return {
    distributeUrls: distributeUrlsMutation.mutate,
    isDistributing: distributeUrlsMutation.isPending,
    result: distributeUrlsMutation.data,
  };
}
