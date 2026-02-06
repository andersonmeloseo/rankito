

# Plano de Otimização de Performance do Dashboard

## ✅ IMPLEMENTADO

### Fase 1: RPCs Criadas
- ✅ `get_subscription_limits_data(p_user_id)` - Elimina N+1 queries
- ✅ `get_dashboard_overview(p_user_id)` - Consolida métricas do dashboard

### Fase 2: Hooks Otimizados
- ✅ `useSubscriptionLimits.ts` - Agora usa RPC (1 query ao invés de N+1)
- ✅ `OverviewCards.tsx` - Agora usa RPC (1 query ao invés de 2-3)
- ✅ `useGlobalFinancialMetrics.ts` - Queries paralelizadas com Promise.all
- ✅ `useAnalytics.ts` - staleTime aumentado para 60s
- ✅ `useUserResources.ts` - Queries paralelizadas (5 queries paralelas ao invés de N+1)

### Fase 3: Cache Otimizado
| Hook | StaleTime Anterior | StaleTime Atual |
|------|-------------------|-----------------|
| `useAnalytics` | 0 | 60000 (1 min) |
| `useSubscriptionLimits` | default | 120000 (2 min) |
| `OverviewCards` | 30000 | 60000 (1 min) |
| `useGlobalFinancialMetrics` | default | 60000 (1 min) |
| `useUserResources` | default | 60000 (1 min) |

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

### Cache existente aproveitado
- `rank_rent_site_metrics_cache` - métricas pré-calculadas
- Triggers de atualização automática já implementados
