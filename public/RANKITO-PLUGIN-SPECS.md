# 📦 Especificações dos Plugins Rankito

## Visão Geral

Sistema com **dois plugins WordPress independentes** para captura de leads e rastreamento de conversões, integrados com RankiTO CRM hospedado em `app.rankitocrm.com`.

---

## 🎨 Plugin 1: Rankito LeadGen

### Objetivo
Captura de leads através de modal customizável com campos dinâmicos (tipo Leadster).

### Funcionalidades Principais

#### 1. Painel Admin WordPress
- **Integração RankiTO**
  - URL da API (default: `https://app.rankitocrm.com/api/external-leads`)
  - Token de autenticação
  - Botão "Testar Conexão" com feedback em tempo real

- **Campos Personalizados** (Estilo Leadster)
  - Adicionar/remover campos customizados
  - Tipos: text, email, phone, textarea, select, checkbox, radio
  - Configurar: label, placeholder, obrigatório, validação
  - Arrastar para reordenar (drag & drop)
  - Preview em tempo real

- **Trigger de Ativação**
  - Botão flutuante (canto inferior direito/esquerdo)
  - Shortcodes: `[rankito_button]`, `[rankito_link]`
  - Posição, ícone, tamanho personalizáveis

- **Visual do Modal**
  - Upload de logo
  - Título e subtítulo customizáveis
  - Cores: fundo, texto, botão primário
  - Largura: pequeno, médio, grande, tela cheia
  - Padding e border radius

- **Mensagens**
  - Sucesso/erro customizáveis
  - Texto de privacidade (LGPD)

- **Avançado**
  - Captura de UTM parameters
  - Captura de User Agent
  - Prevenção de duplicatas (24h)

#### 2. Frontend
- Modal responsivo e acessível (WCAG AA)
- Validação client-side em tempo real
- Feedback visual (loading, sucesso, erro)
- Envio assíncrono para API
- Suporte a campos customizados dinâmicos

#### 3. Endpoint de API

**Envio de Lead:**
```
POST https://app.rankitocrm.com/api/external-leads
Headers:
  x-api-token: [TOKEN]
  Content-Type: application/json

Body:
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "+5511999999999",
  "company": "Empresa XYZ",
  "message": "Quero um orçamento",
  "page_url": "https://site.com/landing",
  "page_title": "Landing Page - Serviços",
  "source_type": "wordpress",
  "utm_source": "google",
  "utm_campaign": "promocao",
  "custom_fields": {
    "budget": "ate_5k",
    "interest": ["seo", "ads"]
  },
  "user_agent": "Mozilla/5.0...",
  "device": "desktop"
}
```

**Teste de Conexão:**
```
GET https://app.rankitocrm.com/api/external-leads/test?token=[TOKEN]

Response:
{
  "success": true,
  "message": "Conexão estabelecida com sucesso!",
  "integration": {
    "name": "Site Exemplo",
    "stats": {
      "total_leads": 42,
      "last_lead_at": "2025-01-15T14:30:00Z"
    }
  }
}
```

### Estrutura de Arquivos
```
rankito-leadgen/
├── rankito-leadgen.php          (Plugin principal)
├── readme.txt                    (Documentação WordPress)
├── includes/
│   ├── class-admin.php          (Painel admin)
│   └── class-frontend.php       (Frontend/Modal)
├── templates/
│   ├── admin-settings.php       (Interface config)
│   └── modal-template.php       (Template modal)
└── assets/
    ├── css/
    │   ├── admin.css            (Estilos admin)
    │   └── frontend.css         (Estilos modal)
    └── js/
        ├── admin.js             (JavaScript admin)
        └── frontend.js          (JavaScript modal)
```

---

## 📊 Plugin 2: Rank & Rent Tracker

### Objetivo
Rastreamento automático de conversões (cliques, page views, forms).

### Funcionalidades

#### 1. Rastreamento Automático
- **Page Views**: Toda visualização de página
- **Cliques em Telefone**: Links `tel:` e botões de chamada
- **Cliques em Email**: Links `mailto:`
- **Cliques em WhatsApp**: Links para WhatsApp
- **Cliques em Botões**: Todos os botões e CTAs
- **Envio de Formulários**: Submissions de forms

#### 2. Painel Admin WordPress
- Nome do site (identificador único)
- URL de rastreamento
- Botão "Testar Conexão"
- Status de instalação do pixel

#### 3. Pixel JavaScript
- Injeção automática em todas as páginas
- Detecção de telefone na página
- Monitoramento de cliques
- Captura de metadados (device, referrer, UTMs)

#### 4. Endpoint de API

**Rastreamento de Conversão:**
```
POST https://app.rankitocrm.com/api/track-conversion
Headers:
  x-tracking-token: [TOKEN_DO_SITE]
  Content-Type: application/json

Body:
{
  "site_name": "meusite.com.br",
  "page_url": "https://meusite.com.br/pagina",
  "event_type": "phone_click",
  "cta_text": "Ligar Agora",
  "metadata": {
    "referrer": "https://google.com",
    "device": "mobile",
    "page_title": "Página Inicial",
    "detected_phone": "(11) 99999-9999"
  }
}
```

**Teste de Conexão:**
```
POST https://app.rankitocrm.com/api/track-conversion
Body: { "event_type": "test", "site_name": "..." }

Response:
{
  "success": true,
  "message": "Connection test successful",
  "site_name": "meusite.com.br"
}
```

### Estrutura de Arquivos
```
rank-rent-tracker/
├── rank-rent-tracker.php        (Plugin principal)
├── readme.txt                    (Documentação)
├── assets/
│   ├── admin.css                (Estilos admin)
│   └── tracking-pixel.js        (Pixel de rastreamento)
└── includes/
    └── class-admin.php          (Painel admin)
```

---

## 🔄 Integração com Sistema RankiTO

### Interface do Sistema (React)

#### 1. Tela de Integrações
**Arquivo:** `src/components/integrations/ExternalSourcesManager.tsx`

- Card destacado: "Plugin Rankito LeadGen"
  - Descrição completa
  - Botão "Baixar Plugin"
  - Botão "Documentação"
  - Badges de funcionalidades

- Card: "Plugin Rank & Rent Tracker"
  - Descrição completa
  - Botão "Baixar Plugin"
  - Link para instruções

- Lista de integrações ativas
  - Nome, tipo, status
  - Token da API (com show/hide)
  - Estatísticas (leads capturados)
  - Botão "Copiar Token"

#### 2. Dialog de Criação
**Arquivo:** `src/components/integrations/CreateIntegrationDialog.tsx`

Ao selecionar "WordPress":
- Perguntar: "Qual plugin você vai usar?"
  - [ ] Rankito LeadGen (captura leads)
  - [ ] Rank & Rent Tracker (rastreia conversões)
- Gerar token automaticamente
- Exibir URL da API específica
- Botão "Copiar Configurações" com JSON pronto

#### 3. Instruções Integradas
**Arquivo:** `src/components/integrations/IntegrationInstructions.tsx`

- Seção WordPress com instruções claras
- Tabs: Instruções / Testar
- Botão "Testar Conexão" funcional
- Exemplos de configuração
- Lista de campos suportados

---

## 🎯 Casos de Uso

### Caso 1: Site de Advogado (LeadGen)
1. Instalar plugin Rankito LeadGen
2. Configurar modal com campos: nome, telefone, especialidade
3. Personalizar cores para combinar com site
4. Publicar botão flutuante "Consulta Gratuita"
5. Leads enviados automaticamente para CRM

### Caso 2: Portfólio Rank & Rent (Tracker)
1. Instalar plugin Rank & Rent Tracker em 10 sites
2. Cada site gera token único
3. Rastrear cliques em telefone automaticamente
4. Dashboard central mostra performance de todos os sites
5. Relatórios para clientes finais

---

## 🔐 Segurança

### Autenticação
- Token único por integração
- Validação server-side
- Rate limiting (100 req/min)

### Dados Capturados
- ✅ Nome, email, telefone (consentimento)
- ✅ IP address (anonimizável)
- ✅ User agent
- ✅ UTM parameters
- ❌ Não captura senhas ou dados sensíveis

### LGPD / GDPR
- Texto de privacidade configurável
- Opção de opt-out
- Dados armazenados criptografados

---

## 📚 Documentação

### Arquivos de Docs
- `public/INSTRUÇÕES-COMPLETAS.md` - Guia completo do sistema
- `public/PLUGIN-INSTALLATION.md` - Instalação passo a passo
- `public/RANKITO-PLUGIN-SPECS.md` - Este arquivo (especificações)

### Links Úteis
- Sistema: `https://app.rankitocrm.com`
- Suporte: `suporte@rankito.com`
- Docs online: `https://docs.rankitocrm.com`

---

## ✅ Checklist de Implementação

### Rankito LeadGen
- [x] Estrutura de arquivos criada
- [x] Painel admin funcional
- [x] Modal responsivo
- [x] Campos customizáveis
- [x] Integração com API
- [x] Teste de conexão
- [x] Validações client-side
- [x] Captura de UTMs
- [x] Shortcodes funcionais

### Rank & Rent Tracker
- [x] Pixel de rastreamento
- [x] Painel admin
- [x] Detecção de eventos
- [x] Integração com API
- [x] Teste de conexão
- [x] Captura de metadados

### Sistema RankiTO
- [x] Tela de integrações
- [x] Download de plugins
- [x] Geração de tokens
- [x] Instruções integradas
- [x] Dashboard de analytics
- [x] Exportação de dados

---

**Desenvolvido para RankiTO CRM**
*Dois plugins, infinitas possibilidades de captura de leads.*
