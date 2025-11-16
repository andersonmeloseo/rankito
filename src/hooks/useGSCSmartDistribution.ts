import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAggregatedGSCQuota } from './useAggregatedGSCQuota';
import { distributeUrls, validateDistribution, previewDistribution, type Integration, type DistributionPreview } from '@/lib/gsc-distribution-engine';
import { createLogger, Logger } from '@/lib/logger';
import { useState } from 'react';

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
  const { data: quota } = useAggregatedGSCQuota({ siteId });
  const [preview, setPreview] = useState<DistributionPreview | null>(null);

  const distributeUrlsMutation = useMutation({
    mutationFn: async ({ siteId, urls }: DistributeUrlsParams): Promise<DistributionResult> => {
      const correlationId = Logger.generateCorrelationId();
      const log = logger.child({ correlationId, siteId });

      log.info(`Iniciando distribuição: ${urls.length} URLs`);

      if (!quota) {
        throw new Error('Dados de quota não disponíveis');
      }

      // Validar distribuição
      const validation = validateDistribution(urls, quota.breakdown);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Converter integrações para formato do engine
      const integrations: Integration[] = quota.breakdown
        .filter(i => i.health_status === 'healthy' || i.health_status === null)
        .map(i => ({
          integration_id: i.integration_id,
          name: i.name,
          email: i.email,
          remaining_today: i.remaining,
          daily_limit: i.limit,
          is_active: true,
          health_status: i.health_status,
          consecutive_failures: 0,
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

  const generatePreview = async (urls: Array<{ url: string; page_id?: string }>) => {
    const log = logger.child({ siteId, operation: 'preview-distribution' });
    
    try {
      log.info('Generating distribution preview', { urlCount: urls.length });

      if (!quota) {
        throw new Error('Quota data not available');
      }

      const integrations: Integration[] = quota.breakdown
        .filter(i => i.health_status === 'healthy' || !i.health_status)
        .map(i => ({
          integration_id: i.integration_id,
          name: i.name,
          email: i.email,
          remaining_today: i.remaining,
          daily_limit: i.limit,
          is_active: true,
          health_status: i.health_status,
          consecutive_failures: 0,
        }));

      const preview = previewDistribution(urls, integrations, 'greedy');
      setPreview(preview);
      
      log.info('Preview generated', { 
        daysNeeded: preview.daysNeeded,
        accountsUsed: preview.summary.accountsUsed 
      });

      return preview;
    } catch (error) {
      log.error('Failed to generate preview', error);
      throw error;
    }
  };

  return {
    distributeUrls: distributeUrlsMutation.mutate,
    isDistributing: distributeUrlsMutation.isPending,
    result: distributeUrlsMutation.data,
    generatePreview,
    preview,
  };
}
