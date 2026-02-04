
## Plano: Correção de Bugs Críticos nos Componentes Analytics

### Bug 1: Sparkline Crash

**Arquivo:** `src/components/analytics/Sparkline.tsx`

**Problema:** Linha 9 faz `data.map()` sem verificar se `data` é undefined, null ou não é array.

**Correção:**
```typescript
export const Sparkline = ({ data, color = "hsl(var(--primary))" }: SparklineProps) => {
  // Guard clause para dados inválidos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null;
  }

  const chartData = data.map((value, index) => ({ value, index }));
  // ... resto do código
};
```

---

### Bug 2: ConversionFunnelChart Divisão por Zero

**Arquivo:** `src/components/analytics/ConversionFunnelChart.tsx`

**Problema:** Linhas 67 e 88 calculam `(interactions / pageViews * 100)` e `(conversions / pageViews * 100)` diretamente no style, sem verificar se `pageViews > 0`. Quando `pageViews = 0`, resulta em `NaN%` ou layout quebrado.

**Linhas afetadas:**
- Linha 67: `style={{ width: \`${(interactions / pageViews * 100) || 0}%\`, minWidth: "75%" }}`
- Linha 88: `style={{ width: \`${(conversions / pageViews * 100) || 0}%\` }}`

**Correção:** Criar funções helper seguras no início do componente:

```typescript
const { pageViews, interactions, conversions } = data;

// Cálculos seguros com verificação de divisão por zero
const interactionRate = pageViews > 0 ? ((interactions / pageViews) * 100).toFixed(1) : "0";
const conversionRate = interactions > 0 ? ((conversions / interactions) * 100).toFixed(1) : "0";

// Larguras seguras para o funil visual
const interactionWidth = pageViews > 0 ? Math.max((interactions / pageViews) * 100, 10) : 75;
const conversionWidth = pageViews > 0 ? Math.max((conversions / pageViews) * 100, 10) : 50;
```

Depois usar nos styles:
- Linha 67: `style={{ width: \`${interactionWidth}%\`, minWidth: "75%" }}`
- Linha 88: `style={{ width: \`${conversionWidth}%\`, minWidth: "50%" }}`

---

### Bug 3: HourlyHeatmap Math.max Vazio

**Arquivo:** `src/components/analytics/HourlyHeatmap.tsx`

**Problema:** Linha 24 faz `Math.max(...data.map(d => d.count))`. Quando `data` é array vazio, `Math.max()` retorna `-Infinity`, causando cálculos incorretos de intensity.

**Correção:**
```typescript
// Guard clause para dados vazios
if (!data || data.length === 0) {
  // Renderizar estado vazio ou usar array default
}

// Cálculo seguro do maxCount
const counts = data.map(d => d.count);
const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
```

---

### Resumo das Alterações

| Arquivo | Bug | Correção |
|---------|-----|----------|
| `Sparkline.tsx` | Crash em `data.map()` | Guard clause no início |
| `ConversionFunnelChart.tsx` | Divisão por zero | Funções helper + minWidth |
| `HourlyHeatmap.tsx` | `Math.max()` retorna `-Infinity` | Verificação antes de Math.max |

---

### Detalhes Técnicos

**Por que `|| 0` não funciona na linha 67:**
```javascript
(interactions / pageViews * 100) || 0
// Se pageViews = 0, resulta em NaN
// NaN || 0 = 0 ✓ (funciona)
// MAS: NaN% no CSS causa problemas de renderização antes da avaliação
```

**Por que Math.max(...[]) = -Infinity:**
```javascript
Math.max()           // → -Infinity (sem argumentos)
Math.max(...[])      // → -Infinity (spread de array vazio)
Math.max(0, ...arr)  // → 0 minimum (solução alternativa)
```
