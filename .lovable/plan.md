
# Plano: Corrigir Timeout na Jornada do Usuário

## Diagnóstico Completo

### O Problema
A aba "Jornada do Usuário" está dando timeout porque:

1. **Hook `useSessionAnalytics`** faz 3 queries pesadas em paralelo:
   - `rank_rent_sessions` (7.362 registros para este site)
   - `rank_rent_page_visits` (10.721 registros para este site)  
   - `rank_rent_conversions` (487.000+ registros TOTAIS)

2. **Índices compostos ausentes**: Queries filtram por `site_id + created_at/entry_time` mas não existem índices compostos para esse padrão

3. **Processamento pesado no frontend**: Após carregar TODOS os dados, o JavaScript faz agregações complexas que deveriam estar no banco

---

## Solução em 2 Fases

### Fase 1: Adicionar Índices Compostos

Criar índices que otimizam o padrão de filtro `site_id + data`:

```sql
-- Índice composto para page_visits (site + data)
CREATE INDEX idx_visits_site_created ON rank_rent_page_visits (site_id, created_at DESC);

-- Índice composto para sessions (site + entry_time)
CREATE INDEX idx_sessions_site_entry ON rank_rent_sessions (site_id, entry_time DESC);
```

### Fase 2: Criar RPC `get_session_analytics`

RPC que retorna dados pré-agregados, eliminando processamento pesado no frontend:

```sql
CREATE OR REPLACE FUNCTION get_session_analytics(
  p_site_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'metrics', (
      SELECT json_build_object(
        'totalSessions', COUNT(*),
        'uniqueVisitors', COUNT(DISTINCT session_id),
        'avgDuration', COALESCE(AVG(total_duration_seconds), 0),
        'avgPagesPerSession', COALESCE(AVG(pages_visited), 0),
        'bounceRate', CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE pages_visited = 1)::NUMERIC / COUNT(*)) * 100 
          ELSE 0 
        END
      )
      FROM rank_rent_sessions
      WHERE site_id = p_site_id
        AND entry_time >= p_start_date
        AND entry_time <= p_end_date
    ),
    'topEntryPages', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]')
      FROM (
        SELECT entry_page_url as page_url, COUNT(*) as entries
        FROM rank_rent_sessions
        WHERE site_id = p_site_id
          AND entry_time >= p_start_date
          AND entry_time <= p_end_date
        GROUP BY entry_page_url
        ORDER BY entries DESC
        LIMIT 10
      ) t
    ),
    'topExitPages', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]')
      FROM (
        SELECT exit_page_url as page_url, COUNT(*) as exits
        FROM rank_rent_sessions
        WHERE site_id = p_site_id
          AND entry_time >= p_start_date
          AND entry_time <= p_end_date
          AND exit_page_url IS NOT NULL
        GROUP BY exit_page_url
        ORDER BY exits DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
```

### Fase 3: Refatorar Hook `useSessionAnalytics`

Substituir queries pesadas pela chamada RPC:

```typescript
// Antes: 3 queries paralelas com fetchAllPaginated
const [sessions, visits, clicks] = await Promise.all([...]);
// Processamento pesado em JavaScript...

// Depois: Uma única chamada RPC
const { data, error } = await supabase
  .rpc("get_session_analytics", {
    p_site_id: siteId,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString()
  });
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Criar índices + RPC `get_session_analytics` |
| `src/hooks/useSessionAnalytics.ts` | Usar RPC ao invés de 3 queries + JS processing |

---

## Resultado Esperado

- **Carregamento**: de **8-15s (timeout)** para **menos de 1 segundo**
- **Eliminação** de erros "statement timeout"
- **Processamento no banco** (otimizado) ao invés do frontend

---

## Detalhes Técnicos

### Índices Atuais (Insuficientes)
- `idx_visits_site` - apenas site_id (não cobre filtro de data)
- `idx_visits_entry_time` - apenas data (não cobre site_id)
- `idx_sessions_entry_time` - apenas data (não cobre site_id)

### Novos Índices (Compostos)
- `idx_visits_site_created (site_id, created_at DESC)` - otimiza filtro combinado
- `idx_sessions_site_entry (site_id, entry_time DESC)` - otimiza filtro combinado

### Por que a RPC é Mais Rápida

| Aspecto | Hooks Atuais | Nova RPC |
|---------|-------------|----------|
| Queries | 3 paralelas + paginação | 1 única |
| Dados transferidos | Todos os registros | Apenas agregados |
| Processamento | JavaScript no browser | SQL no banco (índices) |
| Tempo esperado | 8-15s (timeout) | 100-500ms |
