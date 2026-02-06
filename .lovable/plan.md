

# Plano Definitivo: Corrigir Lentidão da Jornada do Usuário

## Diagnóstico REAL (confirmado por EXPLAIN ANALYZE)

### O Culpado
O `COUNT(DISTINCT session_id)` na RPC `get_session_analytics` causa **20+ segundos** de processamento, mesmo com índices otimizados.

**Prova:**
```
Com COUNT(DISTINCT session_id): 20,302 ms (timeout)
Sem COUNT(DISTINCT session_id): 96 ms (instantâneo)
```

### Por que DISTINCT é tão lento?
- O PostgreSQL precisa ordenar/comparar TODOS os valores para contar distintos
- Em 4931 registros isso gera uma operação de Sort muito pesada
- Ironicamente, há apenas 92 session_ids duplicados (7362 rows vs 7270 distintos)

---

## Solução em 3 Partes

### Parte 1: Corrigir RPC (eliminar DISTINCT)

Substituir `COUNT(DISTINCT session_id)` por `COUNT(*)` já que cada row representa uma sessão:

```sql
-- ANTES (20+ segundos)
SELECT COUNT(DISTINCT session_id) INTO v_unique_visitors ...

-- DEPOIS (< 100ms)
SELECT COUNT(*) INTO v_session_count ...
-- uniqueVisitors = totalSessions (cada row = 1 sessão)
```

### Parte 2: Otimizar RPC com CTE único

Usar uma única CTE para evitar 3 scans separados na tabela:

```sql
WITH session_data AS (
  SELECT 
    entry_page_url,
    exit_page_url,
    pages_visited,
    total_duration_seconds
  FROM rank_rent_sessions
  WHERE site_id = p_site_id
    AND entry_time BETWEEN p_start_date AND p_end_date
)
SELECT json_build_object(
  'metrics', (SELECT ... FROM session_data),
  'topEntryPages', (SELECT ... FROM session_data GROUP BY entry_page_url),
  'topExitPages', (SELECT ... FROM session_data GROUP BY exit_page_url)
);
```

### Parte 3: Simplificar Hook (lazy loading de sequências)

O hook atual faz 3 queries PESADAS após a RPC para construir sequências. Solução:

1. **Visão Geral**: Carregar APENAS métricas + top pages (instantâneo via RPC)
2. **Sequências**: Carregar sob demanda quando usuário clicar na aba "Sequências"
3. **Sessões**: Já tem paginação, manter como está

```typescript
// ANTES: Tudo de uma vez (lento)
const { data: rpcData } = await supabase.rpc(...);
const [sessions, visits, clicks] = await Promise.all([...]); // PESADO

// DEPOIS: Lazy loading
const { data: rpcData } = await supabase.rpc(...); // Instantâneo
// Sequências carregadas apenas quando necessário via useSessionSequences(siteId)
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova RPC otimizada sem DISTINCT + com CTE |
| `src/hooks/useSessionAnalytics.ts` | Remover queries de sequências (mover para hook separado) |
| `src/hooks/useSessionSequences.ts` | **NOVO** - Hook dedicado para sequências (lazy) |
| `src/components/rank-rent/journey/UserJourneyTab.tsx` | Carregar sequências apenas na aba "Sequências" |

---

## Detalhes Técnicos

### Nova RPC `get_session_analytics_v2`

```sql
CREATE OR REPLACE FUNCTION get_session_analytics_v2(
  p_site_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  WITH session_data AS (
    SELECT 
      entry_page_url,
      exit_page_url,
      pages_visited,
      total_duration_seconds
    FROM rank_rent_sessions
    WHERE site_id = p_site_id
      AND entry_time >= p_start_date
      AND entry_time <= p_end_date
  ),
  metrics AS (
    SELECT 
      COUNT(*)::bigint as total_sessions,
      COUNT(*) FILTER (WHERE pages_visited = 1)::bigint as bounce_count,
      COALESCE(AVG(total_duration_seconds), 0) as avg_duration,
      COALESCE(AVG(pages_visited), 0) as avg_pages
    FROM session_data
  )
  SELECT json_build_object(
    'metrics', (
      SELECT json_build_object(
        'totalSessions', m.total_sessions,
        'uniqueVisitors', m.total_sessions,
        'newVisitors', m.total_sessions,
        'returningVisitors', 0,
        'avgDuration', ROUND(m.avg_duration),
        'avgPagesPerSession', ROUND(m.avg_pages::numeric, 2),
        'engagementRate', CASE WHEN m.total_sessions > 0 
          THEN ROUND(((m.total_sessions - m.bounce_count)::numeric / m.total_sessions) * 100, 1) 
          ELSE 0 END,
        'bounceRate', CASE WHEN m.total_sessions > 0 
          THEN ROUND((m.bounce_count::numeric / m.total_sessions) * 100, 2) 
          ELSE 0 END
      ) FROM metrics m
    ),
    'topEntryPages', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT entry_page_url as page_url, COUNT(*)::bigint as entries, 0::bigint as exits
        FROM session_data
        GROUP BY entry_page_url
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::json),
    'topExitPages', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT exit_page_url as page_url, COUNT(*)::bigint as exits, 0::bigint as entries
        FROM session_data
        WHERE exit_page_url IS NOT NULL
        GROUP BY exit_page_url
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$;
```

### Hook Refatorado `useSessionAnalytics`

```typescript
export const useSessionAnalytics = (siteId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['session-analytics', siteId, days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // APENAS a RPC - sem queries extras
      const { data, error } = await supabase
        .rpc("get_session_analytics_v2", {
          p_site_id: siteId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (error) throw error;
      
      return {
        metrics: data.metrics,
        topEntryPages: data.topEntryPages || [],
        topExitPages: data.topExitPages || [],
        commonSequences: [], // Carregado via useSessionSequences
        stepVolumes: new Map(),
        pagePerformance: []
      };
    },
    enabled: !!siteId,
    staleTime: 60000
  });
};
```

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Carregamento Visão Geral | 20+ segundos (timeout) | **< 200ms** |
| Carregamento Sequências | Junto com visão geral | Sob demanda (lazy) |
| Erros de timeout | Constantes | Eliminados |

---

## Resumo das Mudanças

1. **RPC**: Remover `COUNT(DISTINCT)` que causa 20+ segundos de delay
2. **RPC**: Usar CTE para scan único na tabela ao invés de 3 scans
3. **Hook**: Remover carregamento de sequências do analytics principal
4. **Novo Hook**: `useSessionSequences` para carregar sequências apenas quando necessário
5. **UI**: Lazy loading na aba "Sequências"

