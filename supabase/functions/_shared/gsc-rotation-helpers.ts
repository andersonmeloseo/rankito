// Helpers para rotação inteligente de integrações GSC
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DAILY_QUOTA_LIMIT = 200;

interface Integration {
  id: string;
  connection_name: string;
  google_email: string;
  health_status: string;
  health_check_at: string | null;
  consecutive_failures: number;
}

interface IntegrationWithQuota extends Integration {
  used: number;
  remaining: number;
  score: number;
}

/**
 * Calcula score de uma integração baseado em quota disponível, uso recente, taxa de sucesso e tempo de resposta
 */
export function calculateIntegrationScore(
  integration: Integration,
  used: number,
  recentUsage: number = 0
): number {
  const remaining = DAILY_QUOTA_LIMIT - used;
  const quotaPercent = remaining / DAILY_QUOTA_LIMIT;
  
  // Penalizar integrações com uso muito recente (últimas 100 URLs)
  const recentUsagePenalty = Math.min(recentUsage / 100, 1);
  
  // Bonus por alta taxa de sucesso (0-100%)
  const successRate = (integration as any).success_rate || 100;
  const successBonus = successRate / 100;
  
  // Penalty por tempo de resposta lento
  const avgResponseTime = (integration as any).avg_response_time_ms || 0;
  let responsePenalty = 0;
  if (avgResponseTime > 2000) {
    responsePenalty = 0.2; // -20% se resposta > 2s
  } else if (avgResponseTime > 1000) {
    responsePenalty = 0.1; // -10% se resposta > 1s
  }
  
  // Score final: 50% quota + 20% uso recente invertido + 20% sucesso + 10% velocidade
  const score = (quotaPercent * 0.5) + 
                ((1 - recentUsagePenalty) * 0.2) + 
                (successBonus * 0.2) + 
                ((1 - responsePenalty) * 0.1);
  
  return score;
}

/**
 * Seleciona a melhor integração disponível baseada em quota e health
 */
export async function selectBestIntegration(
  supabase: SupabaseClient,
  availableIntegrations: Integration[]
): Promise<IntegrationWithQuota | null> {
  if (availableIntegrations.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar quota e uso recente de cada integração
  const integrationsWithQuota = await Promise.all(
    availableIntegrations.map(async (integration) => {
      // Contar uso hoje
      const { count: usedToday } = await supabase
        .from('gsc_url_indexing_requests')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integration.id)
        .gte('created_at', today.toISOString());

      // Contar uso recente (últimas 100 requisições)
      const { count: recentUsage } = await supabase
        .from('gsc_url_indexing_requests')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integration.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const used = usedToday || 0;
      const remaining = DAILY_QUOTA_LIMIT - used;
      const score = calculateIntegrationScore(integration, used, recentUsage || 0);

      return {
        ...integration,
        used,
        remaining,
        score,
      };
    })
  );

  // Filtrar integrações com quota disponível
  const withQuota = integrationsWithQuota.filter((int) => int.remaining > 0);

  if (withQuota.length === 0) {
    return null;
  }

  // Ordenar por score (maior primeiro)
  withQuota.sort((a, b) => b.score - a.score);

  console.log('📊 Integration scores:', 
    withQuota.map(int => ({
      name: int.connection_name,
      remaining: int.remaining,
      score: int.score.toFixed(2)
    }))
  );

  return withQuota[0];
}

/**
 * Distribui URLs entre integrações de forma balanceada
 */
export async function distributeUrls(
  supabase: SupabaseClient,
  availableIntegrations: Integration[],
  urls: string[],
  distributionSpeed: 'fast' | 'even'
): Promise<Map<string, string[]>> {
  const distribution = new Map<string, string[]>();

  if (availableIntegrations.length === 0 || urls.length === 0) {
    return distribution;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar quota de cada integração
  const integrationsWithQuota = await Promise.all(
    availableIntegrations.map(async (integration) => {
      const { count: used } = await supabase
        .from('gsc_url_indexing_requests')
        .select('*', { count: 'exact', head: true })
        .eq('integration_id', integration.id)
        .gte('created_at', today.toISOString());

      const remaining = DAILY_QUOTA_LIMIT - (used || 0);

      return {
        ...integration,
        remaining,
        used: used || 0,
      };
    })
  );

  // Filtrar integrações com quota
  const withQuota = integrationsWithQuota.filter((int) => int.remaining > 0);

  if (withQuota.length === 0) {
    console.log('⚠️ No integrations with available quota');
    return distribution;
  }

  // Inicializar arrays vazios para cada integração
  withQuota.forEach((int) => {
    distribution.set(int.id, []);
  });

  if (distributionSpeed === 'fast') {
    // Fast: Priorizar integrações com mais quota (greedy)
    withQuota.sort((a, b) => b.remaining - a.remaining);

    let currentIntegrationIndex = 0;
    for (const url of urls) {
      const integration = withQuota[currentIntegrationIndex];
      const urlsAssigned = distribution.get(integration.id)!;

      // Se atingiu limite dessa integração, passar para próxima
      if (urlsAssigned.length >= integration.remaining) {
        currentIntegrationIndex++;
        if (currentIntegrationIndex >= withQuota.length) {
          break; // Todas integrações esgotadas
        }
        continue;
      }

      urlsAssigned.push(url);
      distribution.set(integration.id, urlsAssigned);
    }
  } else {
    // Even: Round-robin uniforme
    let currentIntegrationIndex = 0;
    for (const url of urls) {
      const integration = withQuota[currentIntegrationIndex];
      const urlsAssigned = distribution.get(integration.id)!;

      urlsAssigned.push(url);
      distribution.set(integration.id, urlsAssigned);

      // Próxima integração (circular)
      currentIntegrationIndex = (currentIntegrationIndex + 1) % withQuota.length;
    }
  }

  // Log de distribuição
  console.log('🔀 URL distribution:');
  distribution.forEach((urls, integrationId) => {
    const integration = withQuota.find((int) => int.id === integrationId);
    console.log(`  - ${integration?.connection_name}: ${urls.length} URLs (${integration?.remaining} remaining)`);
  });

  return distribution;
}

/**
 * Registra uso de integração para métricas
 */
export async function logIntegrationUsage(
  supabase: SupabaseClient,
  integrationId: string,
  success: boolean,
  responseTimeMs?: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // Buscar log existente de hoje
    const { data: existingLog } = await supabase
      .from('gsc_integration_usage_logs')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('date', today)
      .single();

    if (existingLog) {
      // Atualizar log existente
      const newUrlsIndexed = success ? existingLog.urls_indexed + 1 : existingLog.urls_indexed;
      const newUrlsFailed = !success ? existingLog.urls_failed + 1 : existingLog.urls_failed;
      
      // Calcular nova média de response time
      let newAvgResponseTime = existingLog.avg_response_time_ms;
      if (responseTimeMs && success) {
        const totalRequests = existingLog.urls_indexed + existingLog.urls_failed;
        const currentTotal = (existingLog.avg_response_time_ms || 0) * totalRequests;
        newAvgResponseTime = Math.round((currentTotal + responseTimeMs) / (totalRequests + 1));
      }

      await supabase
        .from('gsc_integration_usage_logs')
        .update({
          urls_indexed: newUrlsIndexed,
          urls_failed: newUrlsFailed,
          avg_response_time_ms: newAvgResponseTime,
        })
        .eq('id', existingLog.id);
    } else {
      // Criar novo log
      await supabase
        .from('gsc_integration_usage_logs')
        .insert({
          integration_id: integrationId,
          date: today,
          urls_indexed: success ? 1 : 0,
          urls_failed: !success ? 1 : 0,
          avg_response_time_ms: responseTimeMs || null,
        });
    }
  } catch (error) {
    console.error('❌ Error logging integration usage:', error);
  }
}
