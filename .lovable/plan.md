
# Plano: Arquitetura de Carregamento Sob Demanda (Lazy Loading)

## O que acontece hoje

O sistema usa **React + Vite + React Router DOM** (SPA client-side). Nao existe "App Router" ou "Pages Router" como no Next.js. Porem, o problema que voce identificou e real e grave:

### Problema 1: Bundle Monolitico

No `App.tsx`, todas as 15 paginas sao importadas **estaticamente**:

```text
import LandingPage from "./pages/LandingPage";       // 233 linhas + 15 componentes
import Dashboard from "./pages/Dashboard";             // 614 linhas + 40 componentes
import SuperAdminDashboard from "./pages/SuperAdmin";  // 138 linhas + 13 componentes
import SiteDetails from "./pages/SiteDetails";         // 1.591 linhas + 30 componentes
import EnhancedClientPortal from "./pages/Enhanced";   // 421 linhas + 12 componentes
import EndClientPortal from "./pages/EndClient";       // 330 linhas + 10 componentes
... (mais 9 paginas)
```

**Resultado**: Quando alguem abre a Landing Page (pagina publica), o navegador baixa o JavaScript de TODAS as paginas, incluindo Dashboard, SuperAdmin, Analytics, E-commerce - tudo num unico arquivo.

### Problema 2: Componentes Pesados Sempre Montados

Dentro do Dashboard (614 linhas), todos os hooks de todas as abas rodam no mount:
- `useGlobalFinancialMetrics` - roda mesmo na aba Overview
- `useGlobalEcommerceMetrics` - roda mesmo na aba Overview
- `useRealtimeLeads` - roda sempre
- `useUnreadCommunications` - roda sempre

Dentro do SiteDetails (1.591 linhas), 30+ componentes de analytics sao importados estaticamente, mesmo que o usuario so esteja na aba "Paginas".

---

## Solucao: Duas Camadas de Lazy Loading

### Camada 1: Code Splitting por Rota (React.lazy)

Cada pagina so sera baixada quando o usuario navegar para ela:

```text
ANTES (tudo no bundle principal):
┌─────────────────────────────────┐
│         main.js (5MB+)          │
│  LandingPage + Dashboard +     │
│  SuperAdmin + SiteDetails +    │
│  EndClient + EnhancedPortal +  │
│  Auth + ClientReport + ...     │
└─────────────────────────────────┘

DEPOIS (bundles separados):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ main.js      │  │ dashboard.js │  │ sitedetails  │
│ (core: 200K) │  │ (sob demanda)│  │ (sob demanda)│
└──────────────┘  └──────────────┘  └──────────────┘
                  ┌──────────────┐  ┌──────────────┐
                  │ superadmin   │  │ clientportal │
                  │ (sob demanda)│  │ (sob demanda)│
                  └──────────────┘  └──────────────┘
```

### Camada 2: Lazy Loading por Aba (Dashboard e SiteDetails)

Componentes pesados dentro de paginas com abas so serao importados quando a aba for ativada:

```text
Dashboard aba "Overview" ativa:
  ✅ OverviewCards (carregado)
  ❌ CRMHub (NAO carregado)
  ❌ GlobalFinancialOverview (NAO carregado)
  ❌ EcommerceTab (NAO carregado)
  ❌ GeolocationAnalyticsTab (NAO carregado)

Usuario clica em "Financeiro":
  ✅ OverviewCards (cache)
  ❌ CRMHub (NAO carregado)
  ✅ GlobalFinancialOverview (carrega agora!)
  ❌ EcommerceTab (NAO carregado)
```

---

## Mudancas por Arquivo

### 1. `src/App.tsx` - Code Splitting por Rota

**O que muda**: Todas as 15 importacoes estaticas viram `React.lazy()` com `Suspense`.

```typescript
// ANTES
import Dashboard from "./pages/Dashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SiteDetails from "./pages/SiteDetails";

// DEPOIS
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const SiteDetails = lazy(() => import("./pages/SiteDetails"));
```

Adicionar `Suspense` com fallback de loading ao redor das `Routes`.

### 2. `src/pages/Dashboard.tsx` - Lazy Loading por Aba

**O que muda**: Componentes pesados de abas inativas nao serao importados ate serem necessarios.

Componentes a converter para lazy:
- `CRMHub` (aba CRM)
- `GlobalFinancialOverview`, `GlobalFinancialTable`, `GlobalCostSettings`, `PaymentAlerts`, `PaymentsList` (aba Financial)
- `EcommerceTab` (aba E-commerce)
- `GeolocationAnalyticsTab` (aba Geolocation)
- `ClientsListIntegrated` (aba Clients)
- `UserCommunicationsTab` (aba Communication)
- `AcademyTab` (aba Academia)
- `PublicRoadmapTab` (aba Atualizacoes)

Alem disso, os hooks pesados (`useGlobalFinancialMetrics`, `useGlobalEcommerceMetrics`) precisam de `enabled` condicional para so executar quando a aba correspondente estiver ativa:

```typescript
// ANTES - roda SEMPRE
const { sitesMetrics, summary } = useGlobalFinancialMetrics(user?.id || "");
const { data: ecommerceMetrics } = useGlobalEcommerceMetrics(user?.id);

// DEPOIS - so roda quando necessario
const isFinancialOrOverview = activeTab === 'financial' || activeTab === 'overview';
const isEcommerceOrOverview = activeTab === 'ecommerce' || activeTab === 'overview';
```

**Nota**: Os dados de e-commerce e financial aparecem no Overview, entao esses hooks precisam rodar tanto na aba propria quanto no overview.

### 3. `src/pages/SiteDetails.tsx` - Lazy Loading por Aba

**O que muda**: Componentes de analytics, GSC, e-commerce, etc. so serao carregados quando a aba for ativada.

Componentes a converter para lazy:
- Todos os 20+ componentes de analytics (aba Analytics)
- `GSCTabContent` (aba GSC)
- `EcommerceAnalytics` (aba E-commerce)
- `UserJourneyTab` (aba Journey)
- `ReportsTab` (aba Reports)
- `PixelTrackingTab` (aba Integracoes)
- `ConversionGoalsManager` (aba Metas)

### 4. `src/pages/SuperAdminDashboard.tsx` - Lazy Loading por Aba

**O que muda**: Ja usa switch/case (bom!), mas todos os 13 componentes sao importados estaticamente. Converter para lazy.

Componentes a converter:
- `UnifiedUsersTab`
- `PlansManagementTable`
- `SubscriptionMetricsCards`, `SubscriptionsTable`, `PaymentsHistoryTable`
- `GeolocationApisManager`
- `AuditLogsTab`
- `RetentionAnalytics`
- `AdminAutomationsTab`
- `CommunicationTab`
- `VideoTrainingManagementTab`
- `MarketingTab`
- `TechnicalDocumentationTab`
- `BacklogManagementTab`
- Componentes de monitoring

---

## Resultado Esperado

| Metrica | Antes | Depois |
|---------|-------|--------|
| Bundle inicial (Landing Page) | Todo o app (~5MB+) | Core apenas (~500KB) |
| Tempo de carregamento inicial | 3-5s | < 1s |
| Memoria no Dashboard | Todos os componentes montados | So aba ativa |
| JavaScript baixado por sessao | 100% do app | 20-30% (paginas visitadas) |
| Primeira interacao (SiteDetails) | Carrega 30+ componentes | Carrega 5 (aba ativa) |

---

## Detalhes Tecnicos

### Arquivos a Modificar

| Arquivo | Linhas | Mudanca |
|---------|--------|---------|
| `src/App.tsx` | ~99 | React.lazy() para todas as 15 paginas + Suspense wrapper |
| `src/pages/Dashboard.tsx` | ~614 | Lazy import de componentes de abas + enabled condicional nos hooks |
| `src/pages/SiteDetails.tsx` | ~1591 | Lazy import de componentes de abas (analytics, GSC, ecommerce, journey) |
| `src/pages/SuperAdminDashboard.tsx` | ~138 | Lazy import dos 13 componentes de abas |

### Padrao de Implementacao

Para cada pagina com abas, o padrao sera:

```typescript
// Lazy imports
const HeavyComponent = lazy(() => import("@/components/path/HeavyComponent"));

// No render, com Suspense por aba
<TabsContent value="heavy-tab">
  <Suspense fallback={<TabSkeleton />}>
    <HeavyComponent />
  </Suspense>
</TabsContent>
```

### Componente de Loading Reutilizavel

Criar um componente `PageLoadingFallback` para ser usado em todos os Suspense boundaries, tanto a nivel de rota quanto a nivel de aba, mantendo uma experiencia visual consistente.

### Compatibilidade

- `React.lazy()` e nativo do React 18 (ja instalado)
- Vite automaticamente faz code splitting quando detecta `import()` dinamico
- Nao precisa de configuracao adicional no Vite
- Funciona com React Router DOM v6
