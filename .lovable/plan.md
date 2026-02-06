
# Correção: Dados do Analytics Sumiram

## Causa Raiz Identificada

O hook `useAnalytics` está desabilitado porque há um **erro de nome de aba**:

| Componente | Nome usado | Nome esperado |
|------------|------------|---------------|
| `TabsContent` (linha 1326) | `"advanced-analytics"` | - |
| `useAnalytics enabled` (linha 475) | `"analytics"` | `"advanced-analytics"` |

Como `'advanced-analytics' !== 'analytics'`, a condição `enabled: activeTab === 'analytics'` sempre retorna `false` quando o usuário está na aba de analytics, fazendo com que a query **nunca seja executada**.

---

## Correção

Alterar uma única linha no arquivo `src/pages/SiteDetails.tsx`:

**Linha 475:**
```typescript
// ANTES (incorreto)
enabled: activeTab === 'analytics',

// DEPOIS (correto)
enabled: activeTab === 'advanced-analytics',
```

---

## Impacto

- **Positivo**: Os dados de analytics voltarão a aparecer imediatamente quando o usuário acessar a aba "Analytics Avançado"
- **Sem riscos**: Mudança de 1 linha, apenas corrige uma string

---

## Validação

Após a correção, ao acessar a aba `advanced-analytics`:
1. O console deve parar de mostrar `isLoading: true` infinito
2. A requisição para `rank_rent_conversions` deve aparecer no Network
3. Os gráficos e métricas devem renderizar com dados
