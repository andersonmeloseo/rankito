
# Auditoria de Performance: Gargalos Identificados no Rankito

## Resumo Executivo

Encontrei **9 gargalos criticos** que fazem o aplicativo parecer lento. O maior problema nao e uma unica query, mas sim o **padrao de uso**: queries duplicadas, dados carregados antes de serem necessarios, e refetch agressivo desnecessario.

---

## Gargalo 1: useAnalytics.ts - O Maior Vilao (15+ queries simultaneas)

**Impacto: CRITICO**

O hook `useAnalytics` dispara **15 queries separadas** ao banco de dados quando voce abre a aba Analytics. Muitas buscam os **mesmos dados** da tabela `rank_rent_conversions` repetidamente:

| Query | O que busca | Dados duplicados? |
|-------|-------------|-------------------|
| metrics (unique visitors) | `ip_address` de TODOS eventos | Sim - fetchAllPaginated |
| metrics (unique pages) | `page_path` de TODOS eventos | Sim - fetchAllPaginated |
| timeline | `created_at, event_type` TODOS | Sim |
| events | `event_type` TODOS | Sim (subset da timeline) |
| topPages | `page_path, event_type` TODOS | Sim |
| previousMetrics | `*` (TUDO!) do periodo anterior | select("*") desnecessario |
| conversions | `*` (TUDO!) das conversoes | select("*") desnecessario |
| conversionsForTimeline | `created_at, event_type` conversoes | Duplica conversions |
| pageViewsList | `*` (TUDO!) dos page views | select("*") desnecessario |
| funnelData | count de page_views e conversoes | Duplica metrics |
| hourlyData | `created_at` todas conversoes | fetchAllPaginated |
| sparklineData | `created_at, event_type` 7 dias | Subset de timeline |
| conversionRateData | `created_at, event_type` TODOS | Identica a timeline! |
| pageViewsTimeline | `created_at` page views + anterior | Duplica |
| topReferrers | `referrer` TODOS page views | fetchAllPaginated |
| pagePerformance | `page_path, event_type` TODOS | Duplica topPages |

**Solucao**: Consolidar em 2-3 queries maximas. Uma query busca TODOS os eventos do periodo (com campos selecionados), e o processamento das diferentes visualizacoes acontece no frontend via `useMemo`.

---

## Gargalo 2: SiteDetails.tsx - Carrega TUDO ao Abrir

**Impacto: CRITICO**

Quando voce abre um site, o SiteDetails carrega dados de TODAS as abas simultaneamente, mesmo que voce so esteja na aba "Paginas":

- Detalhes do site (2 queries: sites + metrics view)
- Lista de paginas (query na view pesada)
- Total de paginas (count query)
- Limite do plano (query)
- Clientes para filtro (query na view pesada)
- Clientes para atribuicao (query)
- Page views detalhados com `.select("*")` e `.limit(1000)` (query pesada)
- **useAnalytics completo** (15+ queries!)
- Ultimo city de conversao (query)

**Total ao abrir**: ~25 queries simultaneas ao banco!

**Solucao**: Lazy loading por aba. Queries de Analytics so devem rodar quando o usuario navega para a aba Analytics. Queries de page views so quando vai para Page Views.

---

## Gargalo 3: refetchInterval Agressivo

**Impacto: ALTO**

Varias queries refazem polling ao banco a cada poucos segundos, mesmo quando o usuario nao esta olhando:

| Hook | Intervalo | Impacto |
|------|-----------|---------|
| `useRecentSessions` | 15s | Busca sessoes + page visits a cada 15s |
| `useRecentSessionsEnriched` | 15s | Busca sessoes + TODOS eventos com select("*") a cada 15s |
| `useGlobalEcommerceMetrics` | 30s | Busca conversoes de todos os sites a cada 30s |
| `useNotifications` | 30s | OK para notificacoes |
| `useUnreadCommunications` | 30s | OK para comunicacao |
| `useClientIntegration` | 30s | Desnecessario |
| `useEcommerceComparison` | 30s | Desnecessario |
| `useSessionAnalytics` | 60s | Pesado para 60s |

**Solucao**: Aumentar intervalos para 5+ minutos em dados que nao mudam frequentemente. Usar `refetchOnWindowFocus` ao inves de polling constante.

---

## Gargalo 4: select("*") em Queries Pesadas

**Impacto: ALTO**

Varias queries buscam TODAS as colunas quando precisam de apenas 2-3:

1. **previousMetrics** (useAnalytics.ts L387): `.select("*").range(0, 49999)` - Busca ate 50.000 registros com TODAS as colunas so para contar page_views vs conversoes. Deveria usar `.select("created_at, event_type")`.

2. **conversions** (useAnalytics.ts L423): `.select("*")` sem limite - Busca todas as colunas incluindo metadata, referrer, city, ip_address. So precisa de event_type, page_path, created_at, cta_text.

3. **pageViewsList** (useAnalytics.ts L492): `.select("*")` - Busca tudo dos page views. So precisa de created_at, page_path, metadata.

4. **useRecentSessionsEnriched** (L153): `.select('*').in('session_id', sessionTokens)` - Busca TODOS os campos de todas as conversoes das sessoes.

5. **pageViewsData** (SiteDetails.tsx L413): `.select("*").limit(1000)` - Busca 1000 page views completos.

**Solucao**: Especificar apenas os campos necessarios em cada query.

---

## Gargalo 5: QueryClient sem Defaults

**Impacto: MEDIO**

```typescript
// App.tsx - Sem configuracao!
const queryClient = new QueryClient();
```

Sem defaults globais, cada hook precisa configurar `staleTime`, `gcTime`, e `retry` individualmente. Muitos esqueceram, resultando em:
- `staleTime: 0` (default) = refetch em TODA re-renderizacao
- Sem `gcTime` definido = cache padrao de 5 minutos

**Solucao**: Configurar defaults globais sensatos.

---

## Gargalo 6: Queries Duplicadas de current-user

**Impacto: MEDIO**

Em `SiteDetails.tsx`, a query `["current-user"]` aparece **2 vezes** (linhas 79 e 323), e `supabase.auth.getUser()` e chamado dentro de varias queryFn (pageViewsData L407, userPlanLimit L295, clients L356). Cada chamada a `getUser()` faz um request HTTP ao servidor de autenticacao.

**Solucao**: Usar o `user` do `useRole()` context que ja esta disponivel, eliminando calls redundantes a `getUser()`.

---

## Gargalo 7: Dashboard Carrega Todas as Abas

**Impacto: MEDIO**

O Dashboard tem 10 abas mas carrega dados de TODAS ao mesmo tempo:
- Overview (OverviewCards, TopProjects, RecentActivity, QuickAlerts)
- Projetos (SitesList)
- Financial (useGlobalFinancialMetrics - 3 queries paralelas)
- E-commerce (useGlobalEcommerceMetrics - queries pesadas)

Os dados de Financial e E-commerce so deveriam carregar quando o usuario clica nessas abas.

**Solucao**: Lazy loading condicional baseado na aba ativa.

---

## Gargalo 8: View rank_rent_metrics com staleTime: 0

**Impacto: MEDIO**

```typescript
// SiteDetails.tsx L182-184
staleTime: 0,
refetchOnMount: true,
```

A query de `rank_rent_metrics` (view com JOINs complexos) roda com staleTime 0, forcando recalculo em CADA mount. Metricas de site nao mudam a cada segundo.

**Solucao**: `staleTime: 60000` (1 minuto).

---

## Gargalo 9: allClientsData Usa View Pesada

**Impacto: BAIXO**

```typescript
// SiteDetails.tsx L332-348
.from("rank_rent_page_metrics") // VIEW PESADA!
.select("client_name")
```

Para pegar nomes unicos de clientes, faz query na view de metricas (com JOINs e agregacoes). Deveria consultar a tabela base `rank_rent_pages` ou `rank_rent_clients`.

---

## Plano de Implementacao (Priorizado)

### Fase 1: Ganhos Rapidos (Alto Impacto, Baixo Risco)

1. **Configurar QueryClient defaults** em App.tsx
   - `staleTime: 30000` (30s default)
   - `gcTime: 300000` (5 min)
   - `retry: 1`

2. **Reduzir refetchInterval** em todos os hooks agressivos
   - Sessions: 15s -> 120s
   - E-commerce: 30s -> 300s
   - Client integration: 30s -> 120s

3. **Fixar staleTime: 0** no SiteDetails para `staleTime: 60000`

4. **Eliminar queries duplicadas** de `current-user` no SiteDetails

### Fase 2: Otimizacao de Queries (Alto Impacto, Medio Risco)

5. **Substituir select("*")** por campos especificos em:
   - useAnalytics (previousMetrics, conversions, pageViewsList)
   - useRecentSessionsEnriched (allEvents)
   - SiteDetails (pageViewsData)

6. **allClientsData**: Trocar view `rank_rent_page_metrics` por tabela `rank_rent_pages` ou `rank_rent_clients`

### Fase 3: Refatoracao Estrutural (Maior Impacto, Maior Risco)

7. **Lazy loading por aba** no SiteDetails:
   - useAnalytics so roda quando `activeTab === 'analytics'`
   - pageViewsData so roda quando precisa
   
8. **Lazy loading por aba** no Dashboard:
   - Financial so quando `activeTab === 'financial'`
   - E-commerce so quando `activeTab === 'ecommerce'`

9. **Consolidar useAnalytics**: Reduzir de 15+ queries para 2-3 queries com processamento client-side via `useMemo`

---

## Resultado Esperado

| Metrica | Antes | Depois |
|---------|-------|--------|
| Queries ao abrir SiteDetails | ~25 | ~5 (aba atual) |
| Queries ao abrir Dashboard | ~15 | ~5 (overview) |
| Polling requests/minuto | ~12 | ~2 |
| Dados transferidos (Analytics) | ~15 queries x dados duplicados | ~3 queries otimizadas |
| Tempo ate interacao | 3-8s (com timeouts) | < 1s |

---

## Detalhes Tecnicos

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | QueryClient defaults |
| `src/pages/SiteDetails.tsx` | Lazy loading por aba, eliminar duplicatas, otimizar staleTime |
| `src/pages/Dashboard.tsx` | Lazy loading por aba |
| `src/hooks/useAnalytics.ts` | Consolidar queries, select campos especificos |
| `src/hooks/useRecentSessions.ts` | Aumentar refetchInterval |
| `src/hooks/useRecentSessionsEnriched.ts` | Aumentar refetchInterval, select campos |
| `src/hooks/useGlobalEcommerceMetrics.ts` | Aumentar refetchInterval |
| `src/hooks/useSessionAnalytics.ts` | Ajustar refetchInterval |
| `src/hooks/useClientIntegration.ts` | Ajustar refetchInterval |
| `src/hooks/useEcommerceComparison.ts` | Ajustar refetchInterval |
