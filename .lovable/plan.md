
# Motor de Aplicativo Dinâmico - Arquitetura Pós-Login

## Diagnóstico: Onde o Sistema é "Estático" Hoje

| Comportamento Estático | Impacto |
|------------------------|---------|
| **Cada página busca dados do zero** | 2-5s de loading em cada navegação |
| **Sem prefetch inteligente** | Usuário espera em TODA transição |
| **ProtectedRoute duplica auth** | Request redundante + 500ms |
| **Cache curto (30s-60s)** | Dados "expiram" ao voltar para página |
| **Sem compartilhamento de estado** | Dashboard e SiteDetails buscam sites separado |
| **Hooks executam mesmo desabilitados** | Processamento desnecessário |
| **Auth verificada em cada página** | ~3 requests ao /dashboard, ~5 ao /site/:id |

---

## Arquitetura Proposta: Motor de Aplicativo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APP SHELL (Pós-Login)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    AuthGate (único ponto)                    │    │
│  │  • Verifica sessão UMA VEZ                                  │    │
│  │  • Distribui user via Context                               │    │
│  │  • Prefetch dados essenciais em paralelo                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 AppDataProvider (Cache Global)               │    │
│  │  • Sites do usuário (sempre em memória)                     │    │
│  │  • Subscription/Limites (sempre em memória)                 │    │
│  │  • Profile (sempre em memória)                              │    │
│  │  • staleTime: 5min / gcTime: 30min                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              PrefetchOnHover (Preload Inteligente)           │    │
│  │  • Hover em "site card" → prefetch analytics desse site     │    │
│  │  • Click em aba → prefetch dados da próxima aba provável    │    │
│  │  • Transição instantânea (dados já em cache)                │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mudanças Específicas

### 1. Eliminar Verificação Duplicada de Auth

**Arquivo**: `src/components/auth/ProtectedRoute.tsx`

O ProtectedRoute atual faz sua própria verificação de sessão, mas o `RoleContext` já faz isso. Resultado: **2 requests de auth por navegação**.

**Mudança**: Refatorar para consumir `useRole()` ao invés de verificar sessão separadamente.

```typescript
// ANTES (duplica auth)
const checkSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  // + fetch profile
  // + fetch role
};

// DEPOIS (usa contexto existente)
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, role, isLoading } = useRole();
  
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};
```

**Economia**: -2 requests HTTP por navegação protegida.

---

### 2. Criar AppDataProvider - Cache Global de Dados Essenciais

**Novo arquivo**: `src/contexts/AppDataContext.tsx`

Dados que são usados em múltiplas páginas devem ser buscados UMA VEZ e compartilhados:

| Dado | Usado em | Hoje | Proposta |
|------|----------|------|----------|
| Sites do usuário | Dashboard, SitesList, vários hooks | Buscado 3x+ | 1x + cache |
| Subscription/Limites | Dashboard, SiteDetails, AddSite | Buscado 2x+ | 1x + cache |
| Profile | Header, Dashboard, Settings | Buscado 2x+ | 1x + cache |

```typescript
// AppDataContext busca e cacheia dados core no login
export function AppDataProvider({ children }) {
  const { user } = useRole();
  const queryClient = useQueryClient();
  
  // Prefetch dados essenciais em PARALELO assim que user disponível
  useEffect(() => {
    if (!user?.id) return;
    
    // Dispara todas as queries críticas simultaneamente
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['user-sites', user.id],
        queryFn: () => fetchUserSites(user.id),
        staleTime: 300000, // 5 min
      }),
      queryClient.prefetchQuery({
        queryKey: ['subscription-limits'],
        queryFn: () => fetchSubscriptionLimits(user.id),
        staleTime: 300000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['profile', user.id],
        queryFn: () => fetchProfile(user.id),
        staleTime: 600000, // 10 min
      }),
    ]);
  }, [user?.id]);
  
  return children;
}
```

---

### 3. Prefetch Inteligente por Intenção

**Arquivos**: `src/components/rank-rent/SiteCard.tsx`, `src/components/rank-rent/SitesTable.tsx`

Quando o usuário passa o mouse sobre um site, há 70% de chance de clicar. Prefetch os dados antes do click:

```typescript
// No SiteCard ou row da tabela
const handleMouseEnter = () => {
  // Prefetch analytics do site enquanto usuário considera clicar
  queryClient.prefetchQuery({
    queryKey: ['analytics-all-events', site.id, startDate, endDate, 'all', 'all'],
    queryFn: () => fetchSiteAnalytics(site.id),
    staleTime: 120000,
  });
  
  // Prefetch métricas de páginas
  queryClient.prefetchQuery({
    queryKey: ['site-pages', site.id],
    queryFn: () => fetchSitePages(site.id),
    staleTime: 120000,
  });
};

<Card onMouseEnter={handleMouseEnter}>
  {/* conteúdo do card */}
</Card>
```

**Resultado**: Quando usuário clicar, dados JÁ ESTÃO no cache → transição instantânea.

---

### 4. Aumentar staleTime/gcTime para Dados Estáveis

**Arquivos**: Múltiplos hooks

Dados que raramente mudam não precisam ser re-buscados a cada 30 segundos:

| Tipo de Dado | staleTime Atual | Proposta | Motivo |
|--------------|-----------------|----------|--------|
| Sites do usuário | 60s | 5min | Usuário não cria sites a cada minuto |
| Subscription | 120s | 10min | Plano raramente muda |
| Profile | 60s | 30min | Nome/avatar quase nunca muda |
| Analytics | 60s | 2min | Dados históricos são estáveis |
| Pages list | 30s | 3min | Páginas não mudam frequentemente |

---

### 5. Tab Prefetch - Antecipar Próxima Aba

**Arquivo**: `src/pages/SiteDetails.tsx`

Quando usuário está na aba "Overview", prefetch as 2 abas mais prováveis:

```typescript
useEffect(() => {
  if (activeTab === 'overview' && siteId) {
    // Usuário provavelmente vai para Analytics ou Pages
    queryClient.prefetchQuery({
      queryKey: ['analytics-all-events', siteId, ...],
      queryFn: () => fetchAnalytics(siteId),
    });
    queryClient.prefetchQuery({
      queryKey: ['site-pages', siteId],
      queryFn: () => fetchPages(siteId),
    });
  }
}, [activeTab, siteId]);
```

---

### 6. Consolidar Queries Duplicadas

**Problema identificado**: `SitesList.tsx` e `Dashboard.tsx` buscam a mesma lista de sites com queryKeys diferentes.

```typescript
// SitesList.tsx
useQuery({ queryKey: ['sites', user?.id], ... });

// Dashboard overview
useQuery({ queryKey: ['user-sites', user?.id], ... }); // DIFERENTE!

// Outro componente
useQuery({ queryKey: ['rank-rent-sites', user?.id], ... }); // OUTRO!
```

**Solução**: Padronizar queryKey para `['user-sites', userId]` em TODOS os lugares. O React Query automaticamente compartilha o cache.

---

## Fluxo Pós-Login Otimizado

```
Login com sucesso
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              RoleContext já tem user + role                  │
│              (busca única via onAuthStateChange)             │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│        AppDataProvider dispara prefetch paralelo:            │
│        • Sites do usuário                                    │
│        • Subscription/Limites                                │
│        • Profile                                             │
│        (3 queries simultâneas em ~200ms)                     │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard renderiza INSTANTÂNEO                 │
│              (dados já no cache)                             │
└─────────────────────────────────────────────────────────────┘
       │
       ▼  usuário hover em site card
┌─────────────────────────────────────────────────────────────┐
│         Prefetch analytics + pages desse site                │
│         (em background, sem bloquear UI)                     │
└─────────────────────────────────────────────────────────────┘
       │
       ▼  usuário clica no site
┌─────────────────────────────────────────────────────────────┐
│           SiteDetails renderiza INSTANTÂNEO                  │
│           (dados já prefetchados)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Complexidade |
|---------|------|--------------|
| `src/contexts/AppDataContext.tsx` | Criar | Média |
| `src/components/auth/ProtectedRoute.tsx` | Refatorar | Baixa |
| `src/App.tsx` | Adicionar AppDataProvider | Baixa |
| `src/components/rank-rent/SiteCard.tsx` | Adicionar prefetch hover | Baixa |
| `src/components/rank-rent/SitesTable.tsx` | Adicionar prefetch hover | Baixa |
| `src/pages/SiteDetails.tsx` | Tab prefetch + staleTime | Média |
| `src/pages/Dashboard.tsx` | Padronizar queryKeys | Baixa |
| `src/hooks/useUserResources.ts` | Aumentar staleTime | Baixa |
| `src/hooks/useSubscriptionLimits.ts` | Aumentar staleTime | Baixa |
| `src/hooks/useAnalytics.ts` | Ajustar staleTime | Baixa |

---

## Resultado Esperado

| Métrica | Antes (Site Estático) | Depois (Motor de App) |
|---------|----------------------|----------------------|
| Requests de auth por navegação | 2-3 | 0 (contexto) |
| Tempo para Dashboard após login | 2-3s | < 500ms |
| Tempo Dashboard → SiteDetails | 2-4s | < 200ms (prefetch) |
| Tempo para trocar de aba | 1-2s | Instantâneo |
| Re-fetch ao voltar para página | Sempre | Nunca (cache válido) |
| Queries duplicadas | ~15 por sessão | 0 |

---

## Comportamento de "Motor de Aplicativo"

Após implementação, o sistema terá:

1. **Sessão única** - Auth verificada 1x, distribuída via Context
2. **Dados antecipados** - Prefetch antes do usuário pedir
3. **Cache inteligente** - Dados estáveis permanecem em memória
4. **Zero espera** - Navegação entre páginas é instantânea
5. **Economia de recursos** - 70% menos requests ao backend
