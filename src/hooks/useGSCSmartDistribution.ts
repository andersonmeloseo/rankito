import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCAggregatedQuota } from './useGSCAggregatedQuota';

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
}

/**
 * Hook para distribuição inteligente de URLs entre integrações GSC
 * Algoritmo:
 * 1. Busca todas as integrações saudáveis com quota disponível
 * 2. Ordena por quota restante (maior para menor)
 * 3. Distribui URLs de forma balanceada (round-robin)
 * 4. Adiciona à fila de indexação com data programada
 */
export function useGSCSmartDistribution(siteId: string) {
  const queryClient = useQueryClient();
  const { data: quota } = useGSCAggregatedQuota(siteId);

  const distributeUrls = useMutation({
    mutationFn: async ({ siteId, urls }: DistributeUrlsParams): Promise<DistributionResult> => {
      if (!urls || urls.length === 0) {
        throw new Error('Nenhuma URL fornecida');
      }

      // Verificar quota disponível
      if (!quota || quota.estimated_capacity_today === 0) {
        throw new Error('Nenhuma integração GSC disponível ou quota esgotada hoje');
      }

      if (urls.length > quota.estimated_capacity_today) {
        toast.warning(
          `Você tem ${urls.length} URLs mas apenas ${quota.estimated_capacity_today} slots disponíveis hoje. ` +
          `As URLs excedentes serão programadas para os próximos dias.`
        );
      }

      // Buscar integrações saudáveis com quota disponível
      const availableIntegrations = quota.integrations.filter(
        i => i.is_active && 
             (i.health_status === 'healthy' || i.health_status === null) && 
             i.remaining_today > 0
      );

      if (availableIntegrations.length === 0) {
        throw new Error('Nenhuma integração saudável com quota disponível');
      }

      // Ordenar por quota restante (maior primeiro) para balanceamento
      availableIntegrations.sort((a, b) => b.remaining_today - a.remaining_today);

      console.log(`🎯 Distribuindo ${urls.length} URLs entre ${availableIntegrations.length} integrações`);

      const distribution: Record<string, number> = {};
      const queueItems: any[] = [];
      let currentDay = 0;
      let urlsProcessedToday = 0;

      // Distribuir URLs usando round-robin
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        
        // Calcular qual integração deve receber esta URL
        const integrationIndex = i % availableIntegrations.length;
        const integration = availableIntegrations[integrationIndex];

        // Verificar se precisamos mudar de dia
        const urlsDistributedForThisIntegration = Math.floor(i / availableIntegrations.length);
        if (urlsDistributedForThisIntegration >= integration.daily_limit) {
          currentDay++;
          urlsProcessedToday = 0;
        }

        // Calcular data de agendamento
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + currentDay);
        scheduledDate.setHours(0, 0, 0, 0);

        queueItems.push({
          integration_id: integration.integration_id,
          url: url.url,
          page_id: url.page_id || null,
          scheduled_for: scheduledDate.toISOString().split('T')[0],
          status: 'pending',
          attempts: 0,
        });

        distribution[integration.name] = (distribution[integration.name] || 0) + 1;
        urlsProcessedToday++;
      }

      // Inserir em lote na fila
      const { error: insertError } = await supabase
        .from('gsc_indexing_queue')
        .insert(queueItems);

      if (insertError) {
        console.error('❌ Erro ao inserir na fila:', insertError);
        throw new Error(`Erro ao adicionar URLs à fila: ${insertError.message}`);
      }

      console.log('✅ URLs distribuídas com sucesso:', distribution);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-load-distribution', siteId] });

      return {
        success: true,
        total_urls: urls.length,
        queued_urls: queueItems.length,
        skipped_urls: 0,
        distribution,
        message: `${urls.length} URLs distribuídas entre ${availableIntegrations.length} integrações GSC`,
      };
    },
    onSuccess: (result) => {
      toast.success(result.message, {
        description: Object.entries(result.distribution)
          .map(([name, count]) => `${name}: ${count} URLs`)
          .join('\n'),
        duration: 5000,
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
    distributeUrls: distributeUrls.mutate,
    isDistributing: distributeUrls.isPending,
    result: distributeUrls.data,
  };
}
