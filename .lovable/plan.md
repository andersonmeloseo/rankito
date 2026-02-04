
## Plano: Remover console.log de Debug

### Arquivos e Localizacoes

#### 1. src/hooks/useAnalytics.ts (5 console.logs)

| Linhas | Descricao |
|--------|-----------|
| 96-105 | `console.log('📊 Metrics Query Debug:'...)` |
| 212-225 | `console.log('📊 Metrics Query Result (PAGINATED):'...)` |
| 517-524 | `console.log('🔍 PageViewsList Query Debug:'...)` |
| 558-564 | `console.log('🔍 PageViewsList Query Result:'...)` |
| 1004-1011 | `console.log('🔍 Page View Hourly Data Debug:'...)` |

#### 2. src/components/analytics/PageViewsDistributionChart.tsx (1 console.log)

| Linhas | Descricao |
|--------|-----------|
| 22-28 | `console.log('🎨 [PageViewsDistributionChart] Recebeu dados:'...)` |

#### 3. src/components/client-portal/PageViewsTab.tsx (2 console.logs)

| Linhas | Descricao |
|--------|-----------|
| 34-38 | `console.log('[PageViewsTab] 📊 Top page views:'...)` |
| 50-56 | `console.log('📊 [PageViewsTab] deviceDistributionData preparado:'...)` |

---

### Acoes

1. **useAnalytics.ts**: Remover 5 blocos de console.log junto com comentarios associados
2. **PageViewsDistributionChart.tsx**: Remover bloco console.log (linhas 22-28)
3. **PageViewsTab.tsx**: Remover 2 blocos de console.log (linhas 34-38 e 50-56)

---

### Total: 8 console.logs a remover

Nenhuma logica de negocio sera alterada - apenas remocao de logs de debug para producao limpa.
