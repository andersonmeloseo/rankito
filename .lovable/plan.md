

# Plano de Otimização de Performance do Dashboard

## Diagnóstico

### Problema Identificado
O banco de dados está enfrentando **statement timeouts** constantes. Os logs mostram múltiplos erros:
```
"canceling statement due to statement timeout"
```

### Causa Raiz
- **487.430 conversões** na tabela principal
- Múltiplas queries pesadas executando simultaneamente
- Alguns hooks fazem queries N+1 (loop sequencial)
- Falta de cache em queries frequentes

---

## Solução em 3 Fases

### Fase 1: Otimização de Hooks Críticos

#### 1.1 Refatorar `useSubscriptionLimits`
**Problema atual:** Faz N+1 queries - busca sites, depois faz um loop para contar páginas de cada site individualmente.

**Solução:** Criar uma RPC function que retorna tudo em uma única query.

```sql
CREATE OR REPLACE FUNCTION get_subscription_limits_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'subscription', (
      SELECT row_to_json(sub)
      FROM (
        SELECT us.*, sp.name, sp.slug, sp.max_sites, sp.max_pages_per_site
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = p_user_id AND us.status = 'active'
        ORDER BY us.created_at DESC
        LIMIT 1
      ) sub
    ),
    'sites_count', (
      SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id
    ),
    'pages_per_site', (
      SELECT json_object_agg(site_id, page_count)
      FROM (
        SELECT s.id as site_id, COUNT(p.id) as page_count
        FROM rank_rent_sites s
        LEFT JOIN rank_rent_pages p ON p.site_id = s.id
        WHERE s.owner_user_id = p_user_id
        GROUP BY s.id
      ) counts
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

#### 1.2 Refatorar `OverviewCards`
**Problema atual:** Busca todas as conversões com `site_id IN(...)` para contar.

**Solução:** Usar o cache existente `rank_rent_site_metrics_cache`.

```typescript
// Ao invés de buscar conversões
const { data: sites } = await supabase
  .from("rank_rent_sites")
  .select(`
    *,
    rank_rent_site_metrics_cache!left(total_conversions)
  `)
  .eq("owner_user_id", userId);

// Total de conversões já vem agregado
const totalConversions = sites?.reduce(
  (acc, s) => acc + (s.rank_rent_site_metrics_cache?.total_conversions || 0), 
  0
) || 0;
```

#### 1.3 Refatorar `useGlobalFinancialMetrics`
**Problema atual:** Faz 3 queries sequenciais (sites, metrics, configs).

**Solução:** Criar RPC ou usar Promise.all para paralelizar.

```typescript
// Paralelizar as queries
const [sitesResult, metricsResult, configsResult] = await Promise.all([
  supabase.from("rank_rent_sites").select("*").eq("owner_user_id", userId),
  supabase.from("rank_rent_financial_metrics").select("*").eq("user_id", userId),
  supabase.from("rank_rent_financial_config").select("*")
]);
```

---

### Fase 2: Aumentar Cache e StaleTime

#### Hooks para otimizar cache:

| Hook | StaleTime Atual | StaleTime Novo |
|------|-----------------|----------------|
| `useAnalytics` | 0 (sem cache) | 60000 (1 min) |
| `useSubscriptionLimits` | default | 120000 (2 min) |
| `OverviewCards` | 30000 | 60000 (1 min) |
| `useGlobalFinancialMetrics` | default | 60000 (1 min) |

---

### Fase 3: Criar RPC para Dashboard Overview

Consolidar todas as métricas do dashboard em uma única RPC:

```sql
CREATE OR REPLACE FUNCTION get_dashboard_overview(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sites', (SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id),
    'rented_sites', (SELECT COUNT(*) FROM rank_rent_sites WHERE owner_user_id = p_user_id AND is_rented = true),
    'monthly_revenue', (SELECT COALESCE(SUM(monthly_rent_value), 0) FROM rank_rent_sites WHERE owner_user_id = p_user_id AND is_rented = true),
    'total_conversions', (
      SELECT COALESCE(SUM(total_conversions), 0) 
      FROM rank_rent_site_metrics_cache m
      JOIN rank_rent_sites s ON m.site_id = s.id
      WHERE s.owner_user_id = p_user_id
    ),
    'expiring_contracts', (
      SELECT COUNT(*) FROM rank_rent_sites 
      WHERE owner_user_id = p_user_id 
      AND is_rented = true 
      AND contract_end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useSubscriptionLimits.ts` | Usar nova RPC |
| `src/components/rank-rent/OverviewCards.tsx` | Usar cache de métricas |
| `src/hooks/useGlobalFinancialMetrics.ts` | Paralelizar queries |
| `src/hooks/useAnalytics.ts` | Aumentar staleTime |
| `supabase/migrations/` | 2 novas RPCs |

---

## Resultado Esperado

- **Redução de 70-80%** no número de queries
- **Eliminação de timeouts** no dashboard
- **Carregamento 3-5x mais rápido**
- **Menor carga no banco de dados**

---

## Detalhes Técnicos

### Índices já existentes (otimizados)
```sql
idx_conversions_site_created (site_id, created_at DESC)
idx_conversions_site_event_created (site_id, event_type, created_at DESC)
```

### Cache existente a ser aproveitado
- `rank_rent_site_metrics_cache` - já contém métricas pré-calculadas
- Triggers de atualização automática já implementados

