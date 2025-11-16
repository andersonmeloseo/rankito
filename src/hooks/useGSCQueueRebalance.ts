import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGSCSmartDistribution } from './useGSCSmartDistribution';
import { useGSCAggregatedQuota } from './useGSCAggregatedQuota';

interface RebalanceResult {
  message: string;
  urlsRebalanced: number;
}

export interface RebalancePreview {
  totalUrls: number;
  daysNeeded: number;
  distributionByDay: Array<{
    day: number;
    date: string;
    accounts: Array<{
      name: string;
      email: string;
      urls: number;
      capacity: number;
      percentage: number;
    }>;
    totalUrls: number;
  }>;
  summary: {
    todayUrls: number;
    futureUrls: number;
    accountsUsed: number;
  };
}

/**
 * Hook para rebalancear fila de indexação usando distribuição inteligente
 * Remove todas URLs pendentes e as redistribui usando algoritmo greedy
 */
export function useGSCQueueRebalance(siteId: string) {
  const queryClient = useQueryClient();
  const { distributeUrls } = useGSCSmartDistribution(siteId);
  const { data: quotaData } = useGSCAggregatedQuota(siteId);

  const previewRebalance = async (): Promise<RebalancePreview | null> => {
    console.log('🔍 Gerando preview de rebalanceamento...');

    // 1. Buscar URLs pendentes
    const { data: queueItems, error: fetchError } = await supabase
      .from('gsc_indexing_queue')
      .select(`
        id,
        url,
        page_id,
        integration_id,
        google_search_console_integrations!gsc_indexing_queue_integration_id_fkey(site_id)
      `)
      .eq('google_search_console_integrations.site_id', siteId)
      .eq('status', 'pending');

    if (fetchError || !queueItems || queueItems.length === 0) {
      console.log('❌ Nenhuma URL pendente para preview');
      return null;
    }

    // 2. Buscar integrações ativas
    const { data: integrations, error: integrationsError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .eq('health_status', 'healthy')
      .order('consecutive_failures', { ascending: true });

    if (integrationsError || !integrations || integrations.length === 0) {
      console.log('❌ Nenhuma integração ativa disponível');
      return null;
    }

    // 3. Calcular quota disponível por integração
    const today = new Date().toISOString().split('T')[0];
    const integrationsWithQuota = await Promise.all(
      integrations.map(async (integration) => {
    const { count: todayUsage } = await supabase
      .from('gsc_url_indexing_requests')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', integration.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

        const remaining = 200 - (todayUsage || 0);
        return {
          ...integration,
          todayRemaining: Math.max(0, remaining),
          dailyLimit: 200,
        };
      })
    );

    // 4. Simular distribuição greedy
    const distributionByDay: RebalancePreview['distributionByDay'] = [];
    let remainingUrls = queueItems.length;
    let currentDay = 0;
    const startDate = new Date();

    while (remainingUrls > 0 && currentDay < 30) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + currentDay);
      const dateStr = dayDate.toLocaleDateString('pt-BR');

      const dayAccounts: RebalancePreview['distributionByDay'][0]['accounts'] = [];
      let dayTotal = 0;

      // Para cada integração, calcular capacidade do dia
      for (const integration of integrationsWithQuota) {
        const capacity = currentDay === 0 ? integration.todayRemaining : integration.dailyLimit;
        if (capacity <= 0) continue;

        const urlsToAssign = Math.min(capacity, remainingUrls);
        if (urlsToAssign === 0) continue;

        dayAccounts.push({
          name: integration.connection_name,
          email: integration.google_email || 'N/A',
          urls: urlsToAssign,
          capacity,
          percentage: Math.round((urlsToAssign / capacity) * 100),
        });

        dayTotal += urlsToAssign;
        remainingUrls -= urlsToAssign;

        if (remainingUrls === 0) break;
      }

      if (dayTotal > 0) {
        distributionByDay.push({
          day: currentDay,
          date: dateStr,
          accounts: dayAccounts,
          totalUrls: dayTotal,
        });
      }

      currentDay++;
      if (dayTotal === 0) break; // Sem capacidade disponível
    }

    const todayUrls = distributionByDay[0]?.totalUrls || 0;
    const accountsUsed = new Set(distributionByDay.flatMap(d => d.accounts.map(a => a.name))).size;

    return {
      totalUrls: queueItems.length,
      daysNeeded: distributionByDay.length,
      distributionByDay,
      summary: {
        todayUrls,
        futureUrls: queueItems.length - todayUrls,
        accountsUsed,
      },
    };
  };

  const rebalanceQueue = useMutation({
    mutationFn: async (): Promise<RebalanceResult> => {
      console.log('🔄 Iniciando rebalanceamento da fila para site:', siteId);

      // 1. Buscar todas URLs pendentes na fila deste site
      const { data: queueItems, error: fetchError } = await supabase
        .from('gsc_indexing_queue')
        .select('id, url, page_id, integration_id, google_search_console_integrations!inner(site_id)')
        .eq('google_search_console_integrations.site_id', siteId)
        .eq('status', 'pending');

      if (fetchError) {
        console.error('❌ Erro ao buscar URLs pendentes:', fetchError);
        throw new Error(`Erro ao buscar URLs: ${fetchError.message}`);
      }

      if (!queueItems || queueItems.length === 0) {
        console.log('ℹ️ Nenhuma URL pendente para rebalancear');
        return { 
          message: 'Nenhuma URL pendente para rebalancear', 
          urlsRebalanced: 0 
        };
      }

      console.log(`📊 Encontradas ${queueItems.length} URLs pendentes para rebalancear`);

      // 2. Deletar URLs da fila atual
      const urlIds = queueItems.map(item => item.id);
      const { error: deleteError } = await supabase
        .from('gsc_indexing_queue')
        .delete()
        .in('id', urlIds);

      if (deleteError) {
        console.error('❌ Erro ao limpar fila:', deleteError);
        throw new Error(`Erro ao limpar fila: ${deleteError.message}`);
      }

      console.log('✅ Fila antiga limpa, redistribuindo URLs...');

      // 3. Re-adicionar usando distribuição inteligente
      const urls = queueItems.map(item => ({
        url: item.url,
        page_id: item.page_id || undefined,
      }));

      // Chamar distribuição inteligente
      await distributeUrls({ siteId, urls });

      console.log('✅ Rebalanceamento concluído com sucesso');

      return {
        message: `${queueItems.length} URLs rebalanceadas com sucesso`,
        urlsRebalanced: queueItems.length,
      };
    },
    onSuccess: (result) => {
      toast.success('Fila Rebalanceada! 🎯', {
        description: result.message,
        duration: 5000,
      });
      
      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['gsc-indexing-queue', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-aggregated-quota', siteId] });
      queryClient.invalidateQueries({ queryKey: ['gsc-load-distribution', siteId] });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao rebalancear fila:', error);
      toast.error('Erro ao rebalancear fila', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  return {
    rebalanceQueue: rebalanceQueue.mutate,
    isRebalancing: rebalanceQueue.isPending,
    previewRebalance,
  };
}
