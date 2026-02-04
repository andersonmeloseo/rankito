
## Plano: Adicionar Paginacao (fetchAllPaginated) em Queries Analytics

### Problema Identificado

Quatro queries no `useAnalytics.ts` estao limitadas a 1000 registros pelo Supabase PostgREST:

| Query | Linha | Problema |
|-------|-------|----------|
| timeline | 244-288 | `await query` direto, sem paginacao |
| events | 291-326 | `await query` direto, sem paginacao |
| hourlyData | 632-662 | `await query` direto, sem paginacao |
| topReferrers | 825-866 | `await query` direto, sem paginacao |

Sites com mais de 1000 conversoes/page views no periodo selecionado mostram dados incompletos.

---

### Solucao

Substituir `await query` por `await fetchAllPaginated(query)` nas 4 queries, utilizando o helper ja existente no arquivo (linhas 11-33).

---

### Alteracao 1: Timeline Query (linhas 244-288)

**Antes (linha 266-267):**
```typescript
const { data, error } = await query;
if (error) throw error;
```

**Depois:**
```typescript
const data = await fetchAllPaginated<{ created_at: string; event_type: string }>(query);
```

---

### Alteracao 2: Events Query (linhas 291-326)

**Antes (linha 311-313):**
```typescript
const { data, error } = await query;

if (error) throw error;
```

**Depois:**
```typescript
const data = await fetchAllPaginated<{ event_type: string }>(query);
```

---

### Alteracao 3: HourlyData Query (linhas 632-662)

**Antes (linha 650):**
```typescript
const { data, error } = await query;
```

**Depois:**
```typescript
const data = await fetchAllPaginated<{ created_at: string }>(query);
```

---

### Alteracao 4: TopReferrers Query (linhas 825-866)

**Antes (linhas 846-847):**
```typescript
const { data, error } = await query;
if (error) throw error;
```

**Depois:**
```typescript
const data = await fetchAllPaginated<{ referrer: string }>(query);
```

---

### Resumo das Alteracoes

| Arquivo | Acao |
|---------|------|
| `src/hooks/useAnalytics.ts` | 4 substituicoes de `await query` por `fetchAllPaginated()` |

---

### Comportamento do fetchAllPaginated

```typescript
async function fetchAllPaginated<T>(queryBuilder: any, pageSize: number = 1000): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await queryBuilder.range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = [...allData, ...data];
    if (data.length < pageSize) break;
    
    offset += pageSize;
  }
  
  return allData;
}
```

O helper ja trata erros internamente com `throw error`, mantendo o mesmo comportamento de excecao das queries originais.

---

### Impacto

- Timeline: Grafico de visualizacoes/conversoes mostrara dados completos
- Events: Distribuicao de eventos sera precisa para todos os registros
- HourlyData: Heatmap de horarios incluira todas as conversoes
- TopReferrers: Lista de referenciadores tera contagem correta
