
# Plano: Corrigir Lentidão da Lista de Páginas em SiteDetails.tsx

## Diagnóstico

### O Problema Real
O componente `PagesList.tsx` que modificamos **não é usado**! A página `SiteDetails.tsx` tem sua própria implementação inline.

A paginação atual (`pageSize = 100`) não resolve o problema porque:
- Views com `GROUP BY` no PostgreSQL calculam **TODAS** as agregações antes de aplicar `LIMIT`
- Mesmo pedindo 100 registros, o banco processa todas as páginas primeiro

### Código Atual (linhas 104-105)
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(100); // 👈 Muito alto para inicial
```

---

## Solução: Implementar "Load More" Pattern em SiteDetails.tsx

### Parte 1: Mudar Estado Inicial

```typescript
// ANTES
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(100);

// DEPOIS
const [loadedCount, setLoadedCount] = useState(10); // Começar com 10
const [isLoadingMore, setIsLoadingMore] = useState(false);
```

### Parte 2: Modificar Query Principal

```typescript
// ANTES (linha 216-260)
const from = (currentPage - 1) * pageSize;
const to = from + pageSize - 1;
query = query.range(from, to);

// DEPOIS - sempre carregar do início até loadedCount
query = query.range(0, loadedCount - 1);
```

### Parte 3: Adicionar Botão "Carregar Mais"

Substituir a paginação tradicional (linhas 1270-1329) por:

```tsx
{/* Load More Button */}
{pagesData?.total && loadedCount < pagesData.total && (
  <div className="flex justify-center py-6 border-t">
    <Button 
      onClick={handleLoadMore}
      disabled={isLoadingMore}
      variant="outline"
      className="min-w-[280px]"
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
            +{Math.min(100, pagesData.total - loadedCount)} de {pagesData.total - loadedCount} restantes
          </Badge>
        </>
      )}
    </Button>
  </div>
)}

{/* Info quando todas foram carregadas */}
{loadedCount >= (pagesData?.total || 0) && pages.length > 0 && (
  <div className="flex justify-center py-4 border-t text-sm text-muted-foreground">
    Todas as {pagesData?.total} páginas foram carregadas
  </div>
)}
```

### Parte 4: Handler para Carregar Mais

```typescript
const handleLoadMore = async () => {
  setIsLoadingMore(true);
  setLoadedCount(prev => prev + 100);
};

// Reset loading state quando dados chegarem
useEffect(() => {
  if (!pagesLoading) {
    setIsLoadingMore(false);
  }
}, [pagesLoading, pagesData]);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/SiteDetails.tsx` | Implementar load more pattern |

---

## Mudanças Específicas por Linha

### 1. Estados (linhas 103-117)
- Remover: `currentPage`, `pageSize`
- Adicionar: `loadedCount = 10`, `isLoadingMore = false`

### 2. Query (linhas 214-261)
- Remover cálculo de `from/to` baseado em currentPage
- Usar `.range(0, loadedCount - 1)` direto
- Adicionar `loadedCount` na queryKey

### 3. Paginação UI (linhas 1270-1329)
- Remover controles de paginação (Primeira, Anterior, Próxima, Última)
- Remover seletor de "por página"
- Adicionar botão "Carregar Mais" com badge de contagem

### 4. Funções de paginação
- Remover: `handlePageSizeChange`
- Adicionar: `handleLoadMore`
- Adicionar: `useEffect` para resetar `isLoadingMore`

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Carregamento inicial | Timeout | **< 500ms** (10 páginas) |
| Interação | Paginação lenta | Carregar +100 sob demanda |
| UX | Página em branco | Dados visíveis imediatamente |
