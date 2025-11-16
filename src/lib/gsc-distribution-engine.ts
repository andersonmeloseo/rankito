/**
 * Distribution Engine - Motor centralizado de distribuição GSC
 * Consolida toda lógica de distribuição de URLs entre integrações
 */

import { createLogger } from './logger';

const logger = createLogger({ operation: 'distribution-engine' });

export interface Integration {
  integration_id: string;
  name: string;
  email?: string;
  remaining_today: number;
  daily_limit: number;
  is_active: boolean;
  health_status?: string | null;
  consecutive_failures?: number;
}

export interface QueueItem {
  integration_id: string;
  url: string;
  page_id: string | null;
  scheduled_for: string;
  status: string;
  attempts: number;
}

export interface DailyCapacity {
  day: number;
  integrations: Array<{
    integration_id: string;
    name: string;
    available_slots: number;
  }>;
  total_capacity: number;
}

export interface DistributionResult {
  queueItems: QueueItem[];
  distribution: Record<string, number>;
  daysNeeded: number;
  totalUrls: number;
}

/**
 * Calcula capacidade disponível por dia para cada integração
 */
export function calculateDailyCapacity(
  integrations: Integration[],
  day: number
): DailyCapacity {
  const dailyIntegrations = integrations
    .map((int) => ({
      integration_id: int.integration_id,
      name: int.name,
      available_slots:
        day === 0
          ? int.remaining_today // Hoje: usa quota restante
          : int.daily_limit, // Dias futuros: quota completa (200)
    }))
    .filter((int) => int.available_slots > 0);

  const total_capacity = dailyIntegrations.reduce(
    (sum, int) => sum + int.available_slots,
    0
  );

  return { day, integrations: dailyIntegrations, total_capacity };
}

/**
 * Distribui URLs de forma "greedy" - preenche contas com mais espaço primeiro
 */
export function distributeUrlsGreedy(
  urls: Array<{ url: string; page_id?: string }>,
  dailyCapacity: DailyCapacity,
  startDate: Date
): QueueItem[] {
  const queueItems: QueueItem[] = [];
  let urlIndex = 0;

  // Ordenar integrações por espaço disponível (maior primeiro)
  const sortedIntegrations = [...dailyCapacity.integrations].sort(
    (a, b) => b.available_slots - a.available_slots
  );

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
 * Distribui URLs de forma balanceada (round-robin)
 */
export function distributeUrlsEven(
  urls: Array<{ url: string; page_id?: string }>,
  dailyCapacity: DailyCapacity,
  startDate: Date
): QueueItem[] {
  const queueItems: QueueItem[] = [];
  const integrationSlots = new Map(
    dailyCapacity.integrations.map((int) => [int.integration_id, int.available_slots])
  );

  let currentIntegrationIndex = 0;
  const activeIntegrations = [...dailyCapacity.integrations];

  for (const url of urls) {
    if (activeIntegrations.length === 0) break;

    const integration = activeIntegrations[currentIntegrationIndex];
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

    // Decrementar slots disponíveis
    const remaining = integrationSlots.get(integration.integration_id)! - 1;
    integrationSlots.set(integration.integration_id, remaining);

    // Remover integração se esgotou
    if (remaining === 0) {
      activeIntegrations.splice(currentIntegrationIndex, 1);
      if (currentIntegrationIndex >= activeIntegrations.length) {
        currentIntegrationIndex = 0;
      }
    } else {
      // Mover para próxima integração
      currentIntegrationIndex = (currentIntegrationIndex + 1) % activeIntegrations.length;
    }
  }

  return queueItems;
}

/**
 * Executa distribuição completa de URLs usando algoritmo especificado
 */
export function distributeUrls(
  urls: Array<{ url: string; page_id?: string }>,
  integrations: Integration[],
  strategy: 'greedy' | 'even' = 'greedy',
  maxDays: number = 30
): DistributionResult {
  const correlationId = `dist-${Date.now()}`;
  const log = logger.child({ correlationId });

  log.info(`Iniciando distribuição: ${urls.length} URLs, ${integrations.length} integrações, estratégia=${strategy}`);

  const queueItems: QueueItem[] = [];
  const distribution: Record<string, number> = {};
  let remainingUrls = [...urls];
  let currentDay = 0;

  while (remainingUrls.length > 0 && currentDay < maxDays) {
    // Calcular capacidade para este dia
    const dailyCapacity = calculateDailyCapacity(integrations, currentDay);

    log.debug(`Dia ${currentDay}: Capacidade total = ${dailyCapacity.total_capacity}`);

    if (dailyCapacity.total_capacity === 0) {
      currentDay++;
      continue;
    }

    // Distribuir URLs usando algoritmo escolhido
    const urlsToDistribute = remainingUrls.slice(0, dailyCapacity.total_capacity);
    const dayQueueItems =
      strategy === 'greedy'
        ? distributeUrlsGreedy(urlsToDistribute, dailyCapacity, new Date())
        : distributeUrlsEven(urlsToDistribute, dailyCapacity, new Date());

    queueItems.push(...dayQueueItems);

    // Contabilizar distribuição
    dayQueueItems.forEach((item) => {
      const integration = integrations.find(
        (i) => i.integration_id === item.integration_id
      );
      if (integration) {
        distribution[integration.name] = (distribution[integration.name] || 0) + 1;
      }
    });

    // Remover URLs distribuídas
    remainingUrls = remainingUrls.slice(dailyCapacity.total_capacity);
    currentDay++;
  }

  const result: DistributionResult = {
    queueItems,
    distribution,
    daysNeeded: currentDay,
    totalUrls: urls.length,
  };

  log.info('Distribuição concluída', {
    daysNeeded: result.daysNeeded,
    urlsDistributed: result.queueItems.length,
    accounts: Object.keys(distribution).length,
  });

  return result;
}

/**
 * Gera preview de distribuição sem executar
 */
export interface DistributionPreview {
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

export function previewDistribution(
  urls: Array<{ url: string; page_id?: string }>,
  integrations: Integration[],
  strategy: 'greedy' | 'even' = 'greedy'
): DistributionPreview {
  const result = distributeUrls(urls, integrations, strategy);
  const distributionByDay: DistributionPreview['distributionByDay'] = [];
  const accountsUsed = new Set<string>();

  // Agrupar por dia
  const dayGroups = new Map<string, QueueItem[]>();
  result.queueItems.forEach((item) => {
    const day = item.scheduled_for;
    if (!dayGroups.has(day)) {
      dayGroups.set(day, []);
    }
    dayGroups.get(day)!.push(item);
  });

  // Processar cada dia
  Array.from(dayGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateStr, items], index) => {
      const dayAccounts = new Map<string, { name: string; email: string; count: number }>();

      items.forEach((item) => {
        const integration = integrations.find(
          (i) => i.integration_id === item.integration_id
        );
        if (integration) {
          accountsUsed.add(integration.name);
          const key = integration.integration_id;
          if (!dayAccounts.has(key)) {
            dayAccounts.set(key, {
              name: integration.name,
              email: integration.email || '',
              count: 0,
            });
          }
          dayAccounts.get(key)!.count++;
        }
      });

      const accounts = Array.from(dayAccounts.values()).map((acc) => {
        const integration = integrations.find((i) => i.name === acc.name);
        const capacity = index === 0 ? integration?.remaining_today || 0 : integration?.daily_limit || 0;
        return {
          name: acc.name,
          email: acc.email,
          urls: acc.count,
          capacity,
          percentage: capacity > 0 ? (acc.count / capacity) * 100 : 0,
        };
      });

      distributionByDay.push({
        day: index,
        date: new Date(dateStr).toLocaleDateString('pt-BR'),
        accounts,
        totalUrls: items.length,
      });
    });

  const todayUrls = distributionByDay[0]?.totalUrls || 0;
  const futureUrls = result.totalUrls - todayUrls;

  return {
    totalUrls: result.totalUrls,
    daysNeeded: result.daysNeeded,
    distributionByDay,
    summary: {
      todayUrls,
      futureUrls,
      accountsUsed: accountsUsed.size,
    },
  };
}

/**
 * Valida se distribuição é viável
 */
export function validateDistribution(
  urls: Array<{ url: string; page_id?: string }>,
  integrations: Integration[]
): { valid: boolean; error?: string } {
  if (urls.length === 0) {
    return { valid: false, error: 'Nenhuma URL fornecida' };
  }

  const healthyIntegrations = integrations.filter(
    (i) => i.is_active && (i.health_status === 'healthy' || i.health_status === null)
  );

  if (healthyIntegrations.length === 0) {
    return { valid: false, error: 'Nenhuma integração saudável disponível' };
  }

  return { valid: true };
}
