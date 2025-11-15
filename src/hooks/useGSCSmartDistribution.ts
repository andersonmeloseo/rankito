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
  days_needed: number;
}

interface QueueItem {
  integration_id: string;
  url: string;
  page_id: string | null;
  scheduled_for: string;
  status: string;
  attempts: number;
}

interface DailyCapacity {
  day: number;
  integrations: Array<{
    integration_id: string;
    name: string;
    available_slots: number;
  }>;
  total_capacity: number;
}

/**
 * Calcula capacidade disponível por dia para cada integração
 */
function calculateDailyCapacity(
  integrations: Array<any>,
  day: number
): DailyCapacity {
  const dailyIntegrations = integrations
    .map(int => ({
      integration_id: int.integration_id,
      name: int.name,
      available_slots: day === 0 
        ? int.remaining_today  // Hoje: usa quota restante
        : int.daily_limit      // Dias futuros: quota completa (200)
    }))
    .filter(int => int.available_slots > 0);

  const total_capacity = dailyIntegrations.reduce(
    (sum, int) => sum + int.available_slots, 
    0
  );

  return { day, integrations: dailyIntegrations, total_capacity };
}

/**
 * Distribui URLs de forma "greedy" - preenche contas com mais espaço primeiro
 */
function distributeUrlsGreedy(
  urls: Array<{ url: string; page_id?: string }>,
  dailyCapacity: DailyCapacity,
  startDate: Date
): Array<QueueItem> {
  const queueItems: Array<QueueItem> = [];
  let urlIndex = 0;

  // Ordenar integrações por espaço disponível (maior primeiro)
  const sortedIntegrations = [...dailyCapacity.integrations]
    .sort((a, b) => b.available_slots - a.available_slots);

  // Distribuir URLs preenchendo cada conta completamente
  for (const integration of sortedIntegrations) {
    let slotsUsed = 0;

    while (slotsUsed < integration.available_slots && urlIndex < urls.length) {
      const url = urls[urlIndex];
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + dailyCapacity.day);

      queueItems.push({
        integration_id: integration.integration_id,
        url: url.url,
        page_id: url.page_id || null,
        scheduled_for: scheduledDate.toISOString().split('T')[0],
        status: 'pending',
        attempts: 0,
      });

      slotsUsed++;
      urlIndex++;
    }
  }

  return queueItems;
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

      // Buscar integrações saudáveis
      const healthyIntegrations = quota.integrations.filter(
        i => i.is_active && 
             (i.health_status === 'healthy' || i.health_status === null)
      );

      if (healthyIntegrations.length === 0) {
        throw new Error('Nenhuma integração saudável disponível');
      }

      console.log(`🎯 Distribuição inteligente iniciada: ${urls.length} URLs para ${healthyIntegrations.length} integrações`);

      // Calcular capacidade por dia até distribuir todas as URLs
      const queueItems: QueueItem[] = [];
      const distribution: Record<string, number> = {};
      let remainingUrls = [...urls];
      let currentDay = 0;
      const maxDays = 30; // Limite de segurança

      while (remainingUrls.length > 0 && currentDay < maxDays) {
        // Calcular capacidade para este dia
        const dailyCapacity = calculateDailyCapacity(
          healthyIntegrations, 
          currentDay
        );

        console.log(`📅 Dia ${currentDay}: Capacidade total = ${dailyCapacity.total_capacity}`);

        if (dailyCapacity.total_capacity === 0) {
          // Se não tem capacidade, ir para próximo dia
          currentDay++;
          continue;
        }

        // Distribuir URLs usando algoritmo greedy
        const urlsToDistribute = remainingUrls.slice(0, dailyCapacity.total_capacity);
        const dayQueueItems = distributeUrlsGreedy(
          urlsToDistribute,
          dailyCapacity,
          new Date()
        );

        queueItems.push(...dayQueueItems);

        // Contabilizar distribuição
        dayQueueItems.forEach(item => {
          const integration = healthyIntegrations.find(
            i => i.integration_id === item.integration_id
          );
          if (integration) {
            distribution[integration.name] = (distribution[integration.name] || 0) + 1;
          }
        });

        // Remover URLs distribuídas
        remainingUrls = remainingUrls.slice(dailyCapacity.total_capacity);
        currentDay++;
      }

      const daysNeeded = currentDay;

      // Inserir em lote na fila
      const { error: insertError } = await supabase
        .from('gsc_indexing_queue')
        .insert(queueItems);

      if (insertError) {
        console.error('❌ Erro ao inserir na fila:', insertError);
        throw new Error(`Erro ao adicionar URLs à fila: ${insertError.message}`);
      }

      console.log('✅ Distribuição inteligente concluída:', {
        total_urls: urls.length,
        days_needed: daysNeeded,
        distribution,
      });

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
        days_needed: daysNeeded,
        message: daysNeeded === 1 
          ? `${urls.length} URLs agendadas para HOJE usando ${Object.keys(distribution).length} contas`
          : `${urls.length} URLs distribuídas inteligentemente em ${daysNeeded} dia(s)`,
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
    distributeUrls: distributeUrls.mutate,
    isDistributing: distributeUrls.isPending,
    result: distributeUrls.data,
  };
}
