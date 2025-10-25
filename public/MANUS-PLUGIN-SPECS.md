# 📋 Especificação Técnica - Integração Plugin Manus → RankiTO

## 🎯 Visão Geral

O Plugin Manus para WordPress deve capturar leads e enviá-los automaticamente para o CRM RankiTO através de uma API REST.

---

## 🔌 Endpoint Principal

```
POST https://rankito.com/api/external-leads
```

### Headers Obrigatórios

```http
Content-Type: application/json
x-api-token: [TOKEN_DO_CLIENTE]
```

> ⚠️ **Importante:** O token é único por cliente e é gerado no RankiTO quando criam a integração.

---

## 📤 Request Body (JSON)

### Estrutura Completa

```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+5511999999999",
  "company": "Empresa XPTO",
  "message": "Gostaria de mais informações",
  "page_url": "https://site.com.br/contato",
  "page_title": "Página de Contato",
  "source_type": "wordpress_widget",
  "utm_source": "google",
  "utm_campaign": "verao2024",
  "utm_medium": "cpc",
  "custom_fields": {
    "cargo": "Gerente",
    "interesse": "Serviço Premium",
    "origem_click": "Botão Hero"
  }
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ Sim | Nome do lead (mín. 2 caracteres) |
| `email` | string | ❌ Não | Email válido (será validado) |
| `phone` | string | ❌ Não | Telefone com DDD |
| `company` | string | ❌ Não | Nome da empresa |
| `message` | string | ❌ Não | Mensagem ou interesse |
| `page_url` | string | ❌ Não | URL completa da página |
| `page_title` | string | ❌ Não | Título da página |
| `source_type` | string | ❌ Não | Fixo: "wordpress_widget" |
| `utm_source` | string | ❌ Não | Parâmetro UTM source |
| `utm_campaign` | string | ❌ Não | Parâmetro UTM campaign |
| `utm_medium` | string | ❌ Não | Parâmetro UTM medium |
| `custom_fields` | object | ❌ Não | Campos personalizados (chave-valor) |

---

## ✅ Resposta de Sucesso (200)

```json
{
  "success": true,
  "deal_id": "550e8400-e29b-41d4-a716-446655440000",
  "lead_score": 75,
  "lead_quality": "hot",
  "message": "Lead captured successfully"
}
```

### Qualidade do Lead

- `hot`: Score ≥ 70 (lead quente)
- `warm`: Score 40-69 (lead morno)
- `cold`: Score < 40 (lead frio)

### Como o Score é Calculado

| Critério | Pontos |
|----------|--------|
| Telefone preenchido (≥10 dígitos) | +30 |
| Email corporativo (não Gmail/Hotmail) | +20 |
| Empresa preenchida | +25 |
| Mensagem detalhada (>50 caracteres) | +15 |
| Campos personalizados preenchidos | +10 |

---

## ❌ Códigos de Erro

### 400 - Dados Inválidos

```json
{
  "success": false,
  "error": "Name is required (min 2 characters)",
  "code": "INVALID_NAME"
}
```

**Possíveis códigos:**
- `INVALID_NAME` - Nome muito curto ou vazio
- `INVALID_EMAIL` - Email com formato inválido
- `TEMPORARY_EMAIL` - Email temporário/descartável bloqueado

### 401 - Token Inválido

```json
{
  "success": false,
  "error": "Invalid or inactive API token",
  "code": "INVALID_TOKEN"
}
```

**Quando ocorre:**
- Token não existe
- Token inválido
- Integração desativada no CRM

### 409 - Lead Duplicado

```json
{
  "success": false,
  "error": "Duplicate lead - same email submitted in last 24 hours",
  "code": "DUPLICATE_LEAD",
  "existing_deal_id": "uuid-do-deal-existente"
}
```

**Quando ocorre:**
- Mesmo email já foi enviado nas últimas 24 horas

### 500 - Erro Interno

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Descrição técnica do erro"
}
```

---

## 🧪 Endpoint de Teste de Conexão

```
GET https://rankito.com/api/external-leads/test?token=[TOKEN]
```

### Resposta de Sucesso

```json
{
  "success": true,
  "integration_name": "Plugin Manus - Site Principal",
  "integration_type": "wordpress",
  "is_active": true,
  "message": "Token válido! Integração funcionando corretamente."
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "Token inválido",
  "message": "O token fornecido não existe ou está inativo"
}
```

---

## 🎨 Configuração no Plugin Manus

### Campos Necessários no Admin do Plugin

1. **URL da API** (input text)
   - Label: "Endpoint da API RankiTO"
   - Placeholder: `https://rankito.com/api/external-leads`
   - Validação: URL válida

2. **Token da API** (input text, tipo password)
   - Label: "Token de Autenticação"
   - Placeholder: `rkt_abc123...`
   - Validação: Não vazio

3. **Botão "Testar Conexão"**
   - Chama o endpoint `/api/external-leads/test`
   - Exibe feedback visual (✓ verde ou ✗ vermelho)

### Campos Que o Usuário Pode Escolher Capturar

**Checkbox para cada campo:**

- ☑️ Nome (sempre obrigatório, desabilitado)
- ☑️ Email
- ☑️ Telefone
- ☑️ Empresa
- ☑️ Mensagem/Interesse

**Campos Personalizados:**

- [ ] + Adicionar Campo Personalizado
  - Nome do Campo: [input]
  - ID/Slug: [input]

**Captura Automática (sempre ativa):**
- ✅ URL da página atual
- ✅ Título da página
- ✅ Parâmetros UTM (source, campaign, medium)
- ✅ Dispositivo (detectado pelo user-agent)

---

## 🔒 Validações Recomendadas no Plugin (Client-Side)

### Antes de Enviar

```javascript
// Validação de nome
if (name.length < 2) {
  showError('Nome muito curto');
  return;
}

// Validação de email (se preenchido)
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  showError('Email inválido');
  return;
}

// Validação de telefone (se preenchido)
if (phone && phone.replace(/\D/g, '').length < 10) {
  showError('Telefone inválido (mín. 10 dígitos)');
  return;
}
```

---

## 📱 Exemplo de Implementação JavaScript

### Envio Básico

```javascript
async function sendLeadToRankiTO(leadData) {
  const response = await fetch('https://rankito.com/api/external-leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': 'SEU_TOKEN_AQUI'
    },
    body: JSON.stringify({
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      message: leadData.message,
      page_url: window.location.href,
      page_title: document.title,
      source_type: 'wordpress_widget',
      utm_source: getUrlParam('utm_source'),
      utm_campaign: getUrlParam('utm_campaign'),
      utm_medium: getUrlParam('utm_medium'),
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Lead enviado!', result.deal_id);
    showSuccessMessage('Obrigado! Entraremos em contato em breve.');
  } else {
    console.error('Erro:', result.error);
    showErrorMessage('Erro ao enviar. Tente novamente.');
  }
}

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || null;
}
```

### Teste de Conexão

```javascript
async function testConnection(token) {
  try {
    const response = await fetch(
      `https://rankito.com/api/external-leads/test?token=${token}`
    );
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess('✓ Conexão OK!');
    } else {
      showError('✗ Token inválido');
    }
  } catch (error) {
    showError('✗ Erro ao conectar');
  }
}
```

---

## 🎯 Feedback Visual Recomendado

### Após Envio com Sucesso

```
✓ Enviado com sucesso!
Obrigado! Entraremos em contato em breve.
```

### Erros Específicos

| Código | Mensagem Sugerida |
|--------|-------------------|
| `INVALID_NAME` | ⚠️ Nome muito curto. Digite seu nome completo. |
| `INVALID_EMAIL` | ⚠️ Email inválido. Verifique o formato. |
| `INVALID_TOKEN` | ❌ Erro de configuração. Contate o administrador. |
| `DUPLICATE_LEAD` | ⚠️ Você já nos enviou uma mensagem recentemente! |
| `500` | ❌ Erro temporário. Tente novamente em alguns instantes. |

---

## 🚀 Fluxo Completo de Uso

### 1. Administrador do Site

1. Instala o Plugin Manus no WordPress
2. Vai em **Configurações → Manus**
3. Acessa o RankiTO e cria uma integração:
   - **CRM → Integração Externa → Nova Integração**
   - Tipo: "WordPress Plugin"
   - Nome: "Plugin Manus - Site Principal"
4. Copia a **URL da API** e o **Token**
5. Cola no plugin Manus
6. Clica em "Testar Conexão" ✓
7. Configura quais campos capturar
8. Define o estágio padrão em **CRM → Auto-Conversão**
9. Publica o widget no site

### 2. Visitante do Site

1. Preenche o formulário do Manus
2. Clica em "Enviar"
3. Plugin valida os dados
4. Plugin envia POST para RankiTO
5. RankiTO processa e cria o deal
6. Visitante vê mensagem de sucesso
7. Lead aparece **automaticamente** no CRM do cliente no estágio configurado

---

## 🔍 Logs e Debug

### O que o Plugin Deve Registrar

**Sucesso:**
```
[Manus] Lead enviado com sucesso
Deal ID: 550e8400-e29b-41d4-a716-446655440000
Lead Score: 75 (hot)
```

**Erro:**
```
[Manus] Erro ao enviar lead
Código: INVALID_EMAIL
Mensagem: Email inválido
Response: {...}
```

### No RankiTO

Todos os eventos ficam registrados em:
- **CRM → Atividades** (log detalhado)
- **Integração Externa → Estatísticas** (total de leads, última captura)

---

## 📞 Suporte

Para dúvidas técnicas sobre a implementação, entre em contato com a equipe do RankiTO.

**Documentação Completa:**
- Ver instruções no próprio RankiTO em **CRM → Integração Externa → Instruções**

---

## ✅ Checklist de Implementação

- [ ] Endpoint POST implementado
- [ ] Headers `x-api-token` enviado corretamente
- [ ] Validação client-side de campos obrigatórios
- [ ] Captura automática de UTMs
- [ ] Captura automática de page_url e page_title
- [ ] Tratamento de erros (400, 401, 409, 500)
- [ ] Feedback visual para usuário
- [ ] Endpoint de teste implementado
- [ ] Botão "Testar Conexão" funcionando
- [ ] Configuração de campos personalizados
- [ ] Logs para debug
- [ ] Prevenção de múltiplos cliques (debounce)
- [ ] Loading state durante envio

---

**Versão:** 1.0  
**Data:** 2025-01-25  
**Compatibilidade:** RankiTO CRM v2.0+
