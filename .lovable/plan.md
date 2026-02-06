
# Plano: Eliminar Lentidão no Carregamento de Projetos

## Diagnóstico Definitivo

### Problema Principal
Os componentes `SitesList.tsx` e `Dashboard.tsx` estão usando a **VIEW `rank_rent_site_metrics`** que faz cálculos pesados em tempo real sobre **487.000+ conversões**, causando timeouts constantes.

### Evidências dos Logs
Os logs mostram múltiplos erros consecutivos:
```
"canceling statement due to statement timeout"
```

---

## Solução Definitiva

### Criar RPC `get_sites_with_metrics`

Uma única função que retorna todos os dados necessários usando a **tabela cache** ao invés da view pesada:

```sql
CREATE OR REPLACE FUNCTION get_sites_with_metrics(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  site_name TEXT,
  site_url TEXT,
  niche TEXT,
  location TEXT,
  monthly_rent_value NUMERIC,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  is_rented BOOLEAN,
  contract_start_date DATE,
  contract_end_date DATE,
  tracking_pixel_installed BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tracking_token TEXT,
  client_id UUID,
  contract_status TEXT,
  payment_status TEXT,
  next_payment_date DATE,
  auto_renew BOOLEAN,
  owner_user_id UUID,
  indexnow_key TEXT,
  indexnow_validated BOOLEAN,
  is_ecommerce BOOLEAN,
  -- Métricas do cache (instantâneas)
  total_pages BIGINT,
  total_page_views BIGINT,
  total_conversions BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.site_name,
    s.site_url,
    s.niche,
    s.location,
    s.monthly_rent_value,
    s.client_name,
    s.client_email,
    s.client_phone,
    s.is_rented,
    s.contract_start_date,
    s.contract_end_date,
    s.tracking_pixel_installed,
    s.notes,
    s.created_at,
    s.updated_at,
    s.tracking_token,
    s.client_id,
    s.contract_status,
    s.payment_status,
    s.next_payment_date,
    s.auto_renew,
    s.owner_user_id,
    s.indexnow_key,
    s.indexnow_validated,
    s.is_ecommerce,
    -- Métricas
    COALESCE(pc.page_count, 0)::BIGINT AS total_pages,
    COALESCE(m.total_page_views, 0)::BIGINT,
    COALESCE(m.total_conversions, 0)::BIGINT,
    CASE 
      WHEN COALESCE(m.total_page_views, 0) > 0 
      THEN ROUND((COALESCE(m.total_conversions, 0)::NUMERIC / m.total_page_views) * 100, 2)
      ELSE 0
    END AS conversion_rate
  FROM rank_rent_sites s
  LEFT JOIN rank_rent_site_metrics_cache m ON m.site_id = s.id
  LEFT JOIN (
    SELECT site_id, COUNT(*) AS page_count
    FROM rank_rent_pages
    GROUP BY site_id
  ) pc ON pc.site_id = s.id
  WHERE s.owner_user_id = p_user_id
  ORDER BY s.created_at DESC;
END;
$$;
```

### Por que esta RPC é rápida

| Aspecto | VIEW Atual | Nova RPC |
|---------|------------|----------|
| Contagem de conversões | Conta 487k+ registros em tempo real | Usa valor pré-calculado do cache |
| JOINs | Múltiplos JOINs pesados | JOIN simples com tabela cache |
| Contagem de páginas | Recalcula a cada request | Sub-query agregada eficiente |
| Tempo esperado | 8-15 segundos (timeout) | 50-200ms |

---

## Arquivos a Modificar

### 1. `src/components/rank-rent/SitesList.tsx`

**Antes (linha 74-86):**
```typescript
const { data: sites, isLoading } = useQuery({
  queryKey: ["rank-rent-site-metrics", userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("rank_rent_site_metrics")  // VIEW PESADA
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  refetchInterval: 30000,
});
```

**Depois:**
```typescript
const { data: sites, isLoading } = useQuery({
  queryKey: ["rank-rent-site-metrics", userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .rpc("get_sites_with_metrics", { p_user_id: userId });
    if (error) throw error;
    return data;
  },
  staleTime: 60000, // 1 minuto de cache
  refetchInterval: 60000,
});
```

### 2. `src/pages/Dashboard.tsx`

**Antes (linha 162-173):**
```typescript
const { data: allSites } = useQuery({
  queryKey: ["rank-rent-site-metrics", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("rank_rent_site_metrics")  // VIEW PESADA
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});
```

**Depois:**
```typescript
const { data: allSites } = useQuery({
  queryKey: ["rank-rent-site-metrics", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .rpc("get_sites_with_metrics", { p_user_id: user?.id });
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
  staleTime: 60000,
});
```

---

## Resultado Esperado

- Carregamento de projetos: de **8-15s (timeout)** para **menos de 1 segundo**
- Eliminação completa dos erros de timeout
- Cache de 1 minuto reduz requisições repetidas
- Dados consistentes com o cache de métricas já implementado

---

## Resumo das Alterações

| Componente | Alteração |
|------------|-----------|
| Migration SQL | Criar RPC `get_sites_with_metrics` |
| `SitesList.tsx` | Usar RPC + staleTime 60s |
| `Dashboard.tsx` | Usar RPC + staleTime 60s |

