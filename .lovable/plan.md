
# Plano: Implementar "Carregar Mais" na Lista de Páginas

## Diagnóstico

### O Problema
A view `rank_rent_page_metrics` faz:
- JOIN com `rank_rent_conversions` (487.000+ registros)
- Agregações complexas: `COUNT`, `AVG`, `ROUND` para cada página
- Carrega TUDO de uma vez sem limite

### Comportamento Atual
```typescript
// Carrega TODAS as páginas de uma vez
const { data } = await supabase
  .from("rank_rent_page_metrics")
  .select("*")
  .eq("site_id", siteId)
  .order("total_page_views", { ascending: false });
```

---

## Solução: "Load More" Pattern

Implementar carregamento progressivo:
1. **Inicial**: Carrega 10 páginas (instantâneo)
2. **Clique**: Carrega +100 páginas por vez
3. **Botão**: "Carregar Mais" mostra quantas restam

---

## Mudanças no Código

### Arquivo: `src/components/rank-rent/PagesList.tsx`

**1. Novo estado para controle de carregamento:**
```typescript
const [loadedCount, setLoadedCount] = useState(10);
const [isLoadingMore, setIsLoadingMore] = useState(false);
```

**2. Query com paginação no servidor:**
```typescript
const { data: pages, isLoading, refetch } = useQuery({
  queryKey: ["rank-rent-pages", userId, siteId, clientId, loadedCount],
  queryFn: async () => {
    let query = supabase
      .from("rank_rent_page_metrics")
      .select("*")
      .range(0, loadedCount - 1); // Carregar apenas até loadedCount

    if (siteId) query = query.eq("site_id", siteId);
    if (clientId) query = query.eq("client_id", clientId);
    
    query = query.order("total_page_views", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  staleTime: 30000,
});
```

**3. Query separada para contar total:**
```typescript
const { data: totalCount } = useQuery({
  queryKey: ["rank-rent-pages-count", userId, siteId, clientId],
  queryFn: async () => {
    let query = supabase
      .from("rank_rent_pages")  // Tabela base, sem agregações
      .select("id", { count: "exact", head: true });

    if (siteId) query = query.eq("site_id", siteId);
    if (clientId) query = query.eq("client_id", clientId);

    const { count } = await query;
    return count || 0;
  },
});
```

**4. Função "Carregar Mais":**
```typescript
const handleLoadMore = async () => {
  setIsLoadingMore(true);
  setLoadedCount(prev => prev + 100);
  await refetch();
  setIsLoadingMore(false);
};
```

**5. Novo UI do botão:**
```tsx
{pages && totalCount && loadedCount < totalCount && (
  <div className="flex justify-center py-4">
    <Button 
      onClick={handleLoadMore}
      disabled={isLoadingMore}
      variant="outline"
      className="min-w-[200px]"
    >
      {isLoadingMore ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Carregando...
        </>
      ) : (
        <>
          Carregar Mais
          <Badge variant="secondary" className="ml-2">
            +{Math.min(100, totalCount - loadedCount)} de {totalCount - loadedCount} restantes
          </Badge>
        </>
      )}
    </Button>
  </div>
)}
```

---

## Resultado Visual

### Antes:
```
⏳ Carregando... (10+ segundos, timeout frequente)
```

### Depois:
```
📊 10 páginas exibidas de 2.500 total
[Carregar Mais (+100 de 2.490 restantes)]
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/rank-rent/PagesList.tsx` | Implementar load more pattern |

---

## Detalhes Técnicos

### Por que `.range(0, 9)` é mais rápido?

O PostgreSQL pode usar o índice para ordenar e retornar apenas os primeiros N registros SEM calcular agregações para TODAS as páginas:

```sql
-- ANTES (lento): Calcula tudo, retorna tudo
SELECT * FROM rank_rent_page_metrics WHERE site_id = '...'

-- DEPOIS (rápido): Para após encontrar os primeiros 10
SELECT * FROM rank_rent_page_metrics WHERE site_id = '...'
ORDER BY total_page_views DESC LIMIT 10
```

### Fluxo de Carregamento

1. **Primeiro render**: Carrega 10 páginas (rápido)
2. **Usuário clica "Carregar Mais"**: Carrega 110 (0-109)
3. **Clica novamente**: Carrega 210 (0-209)
4. **E assim por diante...** até ter todas

### Vantagens da Abordagem

- Carregamento inicial instantâneo
- Usuário vê dados imediatamente
- Pode continuar carregando se precisar
- Sem timeout
