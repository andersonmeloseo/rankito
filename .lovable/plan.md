
# Correção: Conversões Detalhadas e Visualizações de Página

## Problemas Identificados

### Problema 1: PageViewsTable recebe array vazio
**Console log confirma**: `pageViews: [], count: 0`

A query `pageViewsData` tem uma condição `enabled` incorreta:

```typescript
// src/pages/SiteDetails.tsx, linha 454
enabled: !!siteId && activeTab === 'pageviews', // ❌ ERRADO
```

- `activeTab` é a aba **principal** = `'advanced-analytics'`
- `'pageviews'` é uma **sub-aba** dentro de `advanced-analytics`
- Resultado: a condição `activeTab === 'pageviews'` **nunca é verdadeira**
- A query **nunca executa**, retornando array vazio

### Problema 2: Campos faltantes nas queries

A query do `useAnalytics.ts` seleciona campos limitados:

```typescript
// Linha 112 - useAnalytics.ts
.select("id, created_at, event_type, page_path, page_url, ip_address, cta_text, city, referrer, metadata, is_ecommerce_event")
```

**Campos faltantes** que as tabelas precisam:
| Campo | Usado em | Para |
|-------|----------|------|
| `user_agent` | ConversionsTable, PageViewsTable | Detectar browser |
| `region` | ConversionsTable, PageViewsTable | Localização completa |
| `country` | ConversionsTable, PageViewsTable | Localização completa |

### Problema 3: PageViewsData não busca campos necessários

A query separada em `SiteDetails.tsx` (linha 422):
```typescript
.select("id, created_at, page_url, page_path, ip_address, city, referrer, metadata")
```

**Faltam**: `user_agent`, `region`, `country`

---

## Correções Necessárias

### Correção 1: Habilitar query pageViewsData corretamente

**Arquivo**: `src/pages/SiteDetails.tsx`  
**Linha**: 454

```typescript
// ANTES (incorreto)
enabled: !!siteId && activeTab === 'pageviews',

// DEPOIS (correto) - Executar quando na aba de analytics
enabled: !!siteId && activeTab === 'advanced-analytics',
```

### Correção 2: Adicionar campos faltantes na query pageViewsData

**Arquivo**: `src/pages/SiteDetails.tsx`  
**Linha**: 422

```typescript
// ANTES
.select("id, created_at, page_url, page_path, ip_address, city, referrer, metadata")

// DEPOIS - Adicionar user_agent, region, country
.select("id, created_at, page_url, page_path, ip_address, city, region, country, referrer, metadata, user_agent")
```

### Correção 3: Adicionar campos faltantes no useAnalytics

**Arquivo**: `src/hooks/useAnalytics.ts`  
**Linha**: 112

```typescript
// ANTES
.select("id, created_at, event_type, page_path, page_url, ip_address, cta_text, city, referrer, metadata, is_ecommerce_event")

// DEPOIS - Adicionar user_agent, region, country
.select("id, created_at, event_type, page_path, page_url, ip_address, cta_text, city, region, country, referrer, metadata, is_ecommerce_event, user_agent")
```

### Correção 4: Atualizar interface RawEvent

**Arquivo**: `src/hooks/useAnalytics.ts`  
**Linhas**: 44-57

```typescript
// Adicionar campos à interface
interface RawEvent {
  id: string;
  created_at: string;
  event_type: string;
  page_path: string;
  page_url: string | null;
  ip_address: string | null;
  cta_text: string | null;
  city: string | null;
  region: string | null;      // ✅ ADICIONAR
  country: string | null;     // ✅ ADICIONAR
  referrer: string | null;
  metadata: any;
  is_ecommerce_event: boolean | null;
  user_agent: string | null;  // ✅ ADICIONAR
}
```

---

## Resumo das Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/pages/SiteDetails.tsx` | 454 | Corrigir condição `enabled` |
| `src/pages/SiteDetails.tsx` | 422 | Adicionar `user_agent, region, country` no select |
| `src/hooks/useAnalytics.ts` | 112 | Adicionar `user_agent, region, country` no select |
| `src/hooks/useAnalytics.ts` | 44-57 | Atualizar interface `RawEvent` |

---

## Resultado Esperado

Após as correções:

1. **PageViewsTable** receberá dados reais (não array vazio)
2. **ConversionsTable** mostrará browser e localização completa
3. **Paginação** continuará funcionando normalmente (já existe nos componentes)
4. Filtros e ordenação também funcionarão com os campos adicionais
