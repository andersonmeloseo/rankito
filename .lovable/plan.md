

# Correção: Conversões Não Aparecem - Bug na Paginação

## Causa Raiz

A função `fetchAllPaginated` no arquivo `src/hooks/useAnalytics.ts` tem um bug crítico:

```typescript
async function fetchAllPaginated<T>(queryBuilder: any, pageSize: number = 5000): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;
  
  while (true) {
    // BUG: Reutiliza o mesmo queryBuilder com .range() múltiplas vezes
    const { data, error } = await queryBuilder.range(offset, offset + pageSize - 1);
    // ...
  }
}
```

O problema é que o Supabase JS **modifica** o query builder internamente quando `.range()` é chamado. Na segunda iteração do loop, a query já tem o range anterior aplicado, e chamar `.range()` novamente não substitui corretamente.

**Resultado**: Apenas a primeira página (5000 registros) é buscada, e os `whatsapp_click` (100 conversões) ficam além desse limite.

---

## Solução

Refatorar `fetchAllPaginated` para criar uma nova query builder a cada iteração, usando uma função factory:

```typescript
// Arquivo: src/hooks/useAnalytics.ts

async function fetchAllPaginated<T>(
  createQuery: () => any,  // Factory function que cria nova query
  pageSize: number = 5000
): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;
  
  while (true) {
    // Cria uma NOVA query a cada iteração
    const query = createQuery();
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = [...allData, ...data];
    
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  
  return allData;
}
```

---

## Alterações nos Chamadores

### Query 1: allEvents (linha 110-130)

```typescript
// ANTES
const { data: allEvents } = useQuery({
  queryFn: async () => {
    let query = supabase
      .from("rank_rent_conversions")
      .select("...")
      .eq("site_id", siteId)
      // ...filtros
    return fetchAllPaginated<RawEvent>(query);
  },
});

// DEPOIS
const { data: allEvents } = useQuery({
  queryFn: async () => {
    const createQuery = () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("id, created_at, event_type, page_path, page_url, ip_address, cta_text, city, region, country, referrer, metadata, is_ecommerce_event, user_agent")
        .eq("site_id", siteId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (device !== "all") {
        query = query.filter('metadata->>device', 'eq', device);
      }
      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }
      return query;
    };
    
    return fetchAllPaginated<RawEvent>(createQuery);
  },
});
```

### Query 2: previousEvents (linha 139-160)

```typescript
// DEPOIS
const { data: previousEvents } = useQuery({
  queryFn: async () => {
    const createQuery = () => {
      let query = supabase
        .from("rank_rent_conversions")
        .select("event_type, ip_address, page_path")
        .eq("site_id", siteId)
        .gte("created_at", previousStart)
        .lte("created_at", previousEnd);

      if (conversionType === "ecommerce") {
        query = query.eq("is_ecommerce_event", true);
      } else if (conversionType === "normal") {
        query = query.eq("is_ecommerce_event", false);
      }
      return query;
    };
    
    return fetchAllPaginated<{ event_type: string; ip_address: string; page_path: string }>(createQuery);
  },
});
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useAnalytics.ts` | Refatorar `fetchAllPaginated` para usar factory function |

---

## Resultado Esperado

Após a correção:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Conversões exibidas | 5 | 100 (todas) |
| Páginas buscadas | 1 (5000 registros) | 2 (7070 registros) |
| Requisições de rede | 1 | 2 |

A tabela "Conversões Detalhadas" mostrará todas as 100 conversões do período, com paginação funcionando corretamente (20 por página).

