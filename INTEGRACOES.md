# 🔌 Guia de Integrações - Rankito CRM

## Integrações Disponíveis

### 1️⃣ Webhook / Chatbot (Recomendado para WhatsApp)

**O que faz:**
- Recebe leads de chatbots (ManyChat, Chatfuel, etc.)
- Integra com WhatsApp Business API
- Conecta plataformas de automação (Zapier, Make, n8n)
- Captura leads de formulários externos

**Como configurar:**
1. No CRM: Integrações → Nova Integração → Webhook/Chatbot
2. Copie a URL do webhook e o Token
3. Configure no seu chatbot ou plataforma de automação
4. Teste enviando um lead

**Formato do payload (JSON):**
```json
{
  "name": "Nome do Lead",
  "phone": "(11) 99999-9999",
  "email": "email@exemplo.com",
  "message": "Mensagem do contato",
  "source_type": "webhook",
  "custom_fields": {
    "origem": "WhatsApp",
    "bot": "chatbot-vendas"
  }
}
```

**Headers necessários:**
```
Content-Type: application/json
x-api-token: seu_token_aqui
```

**Casos de uso:**
- ✅ ManyChat/Chatfuel → Configure HTTP Request com POST
- ✅ Zapier/Make → Adicione ação Webhook com POST
- ✅ WhatsApp Business API → Configure webhook de mensagens
- ✅ Chatbots personalizados → Envie POST ao receber mensagem

---

### 2️⃣ WordPress Plugin

**O que faz:**
- Rastreamento automático de page views
- Captura de cliques em telefone, email, WhatsApp
- Integração com Contact Form 7, Gravity Forms, WPForms
- Score automático de leads
- UTM tracking

**Como instalar:**
1. No CRM: Integrações → Nova Integração → WordPress
2. Copie a URL da API e o Token
3. Instale o plugin no WordPress (ver INSTRUÇÕES-COMPLETAS.md)
4. Configure no painel WordPress → Configurações → Rank & Rent CRM
5. Cole a URL da API e o Token
6. Teste preenchendo um formulário

**Recursos:**
- ✅ Captura automática de formulários (CF7, Gravity, WPForms)
- ✅ Intercepta botões de WhatsApp e telefone
- ✅ Score automático de leads
- ✅ Tracking de UTMs e origem

---

### 3️⃣ API Direta

**O que é:**
Endpoint HTTP REST para integração customizada com qualquer sistema.

**Endpoint:**
```
POST https://app.rankitocrm.com/functions/v1/create-deal-from-external-source
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-api-token": "seu_token_aqui"
}
```

**Body (JSON):**
```json
{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "phone": "(11) 99999-9999",
  "message": "Gostaria de um orçamento",
  "company": "Empresa XYZ",
  "page_url": "https://origem.com/pagina",
  "source_type": "api",
  "custom_fields": {
    "interesse": "Serviço Premium"
  }
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "deal_id": "uuid-do-deal",
  "lead_score": 75,
  "lead_quality": "hot",
  "message": "Lead captured successfully"
}
```

**Campos obrigatórios:**
- `name` (string, mín. 2 caracteres)

**Campos opcionais:**
- `email`, `phone`, `message`, `company`, `page_url`, `custom_fields`

**Casos de uso:**
- Sistemas internos
- Aplicativos mobile
- Landing pages customizadas
- Integrações avançadas

---

## ❌ Integrações NÃO Suportadas

### Chrome Extension (WhatsApp Web)
**Status:** Removida permanentemente

**Por quê?**
- Conflitos com políticas de segurança do WhatsApp Web
- Instabilidade e baixa taxa de sucesso  
- Complexidade de manutenção
- WhatsApp bloqueia automaticamente extensões não oficiais

**Alternativas Recomendadas:**

#### 1. **WhatsApp Business API + Webhook (MELHOR OPÇÃO)**
```
WhatsApp Business API → Webhook → Rankito CRM
```
- 100% confiável e oficial
- Automação completa
- Suporta templates e botões
- Custo: ~R$100/mês (via fornecedores como Twilio, 360dialog)

**Como configurar:**
1. Contrate WhatsApp Business API
2. Configure webhook para receber mensagens
3. No webhook, faça POST para API do Rankito:
```javascript
fetch('https://app.rankitocrm.com/functions/v1/create-deal-from-external-source', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-token': 'SEU_TOKEN'
  },
  body: JSON.stringify({
    name: whatsappContact.name,
    phone: whatsappContact.phone,
    message: messageText,
    source_type: 'webhook',
    custom_fields: { origem: 'WhatsApp Business API' }
  })
});
```

#### 2. **Chatbot + Webhook (ManyChat, Chatfuel)**
```
ManyChat/Chatfuel → Ação HTTP → Rankito CRM
```
- Sem código
- Interface visual
- Integração em minutos
- Custo: Grátis até 1k contatos

**Como configurar (ManyChat):**
1. No ManyChat: Flow → Add Action → External Request
2. Method: POST
3. URL: `https://app.rankitocrm.com/functions/v1/create-deal-from-external-source`
4. Headers:
   - `Content-Type: application/json`
   - `x-api-token: SEU_TOKEN`
5. Body:
```json
{
  "name": "{{first_name}} {{last_name}}",
  "phone": "{{phone}}",
  "message": "{{last_input_text}}",
  "source_type": "webhook"
}
```

#### 3. **Zapier/Make (No-Code)**
```
WhatsApp → Zapier/Make → Rankito CRM
```
- Sem código
- Centenas de integrações prontas
- Ideal para quem já usa Zapier
- Custo: Plano Zapier ($20/mês) + WhatsApp integration

**Como configurar (Zapier):**
1. Trigger: Escolha integração WhatsApp (ex: Twilio, 360dialog)
2. Action: Webhooks by Zapier → POST
3. URL: `https://app.rankitocrm.com/functions/v1/create-deal-from-external-source`
4. Payload Type: JSON
5. Headers:
   - `Content-Type: application/json`
   - `x-api-token: SEU_TOKEN`
6. Data: Mapear campos do trigger

#### 4. **Manual (Temporário)**
Enquanto não configura automação:
1. Receba mensagem no WhatsApp
2. Abra Rankito CRM → Aba CRM
3. Clique em "Novo Deal"
4. Preencha manualmente

---

## 🔧 Troubleshooting

### Webhook não recebe leads

**Verifique:**
1. URL está correta (incluindo `/functions/v1/`)
2. Token está no header `x-api-token`
3. `Content-Type: application/json`
4. Campo `name` está preenchido (obrigatório)
5. JSON está válido (use JSONLint.com)

**Teste manual (cURL):**
```bash
curl -X POST \
  https://app.rankitocrm.com/functions/v1/create-deal-from-external-source \
  -H 'Content-Type: application/json' \
  -H 'x-api-token: SEU_TOKEN' \
  -d '{
    "name": "Teste",
    "phone": "11999999999",
    "source_type": "webhook"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "deal_id": "...",
  "lead_score": 50,
  "message": "Lead captured successfully"
}
```

### WordPress Plugin não rastreia

1. Verificar JavaScript habilitado no navegador
2. Testar conexão no admin do plugin (botão "Testar Conexão")
3. Ver console do navegador (F12 → Console)
4. Confirmar token e URL estão corretos

### API retorna erro 401

- ❌ Token inválido ou expirado
- ❌ Header `x-api-token` está faltando
- ❌ Integração está desativada no CRM

**Solução:**
1. No CRM: Integrações → Copie token novamente
2. Verifique se integração está "Ativa" (toggle verde)
3. Cole o novo token na sua plataforma

### API retorna erro 400

- ❌ JSON inválido
- ❌ Campo `name` faltando ou vazio
- ❌ Campo `name` com menos de 2 caracteres

**Solução:**
1. Validar JSON em JSONLint.com
2. Garantir que `name` tem pelo menos 2 caracteres
3. Ver logs da edge function no Supabase

---

## 📊 Monitoramento

### Ver estatísticas de integração

1. No CRM: Integrações → Clique no ícone de gráfico
2. Veja:
   - Total de leads capturados
   - Último lead recebido
   - Taxa de sucesso
   - Distribuição por qualidade (Hot/Warm/Cold)

### Verificar se integração está ativa

- ✅ Badge verde "Ativo"
- ✅ Toggle ligado
- ✅ Estatísticas sendo atualizadas

### Testar integração

1. Envie lead de teste
2. Aguarde 5 segundos
3. Atualize página do CRM → Aba CRM
4. Lead deve aparecer no estágio "Lead"

---

## 🎯 Qual integração escolher?

| Necessidade | Integração Recomendada |
|------------|------------------------|
| Capturar leads do WhatsApp | **Webhook + WhatsApp Business API** |
| Capturar formulários WordPress | **WordPress Plugin** |
| Integrar com sistema próprio | **API Direta** |
| Automação sem código | **Zapier/Make + Webhook** |
| Chatbot no site | **ManyChat + Webhook** |
| Rápido e simples | **WordPress Plugin** |
| Máxima flexibilidade | **API Direta** |

---

## 🚀 Próximos Passos

1. **Escolha a integração** ideal para seu caso
2. **Configure seguindo as instruções** desta documentação
3. **Teste enviando um lead** de exemplo
4. **Monitore as estatísticas** na aba Integrações
5. **Otimize o funil** baseado nos dados capturados

**Precisa de ajuda?**
- 📧 Suporte via CRM (botão de ajuda)
- 📚 Documentação completa: INSTRUÇÕES-COMPLETAS.md
- 🔗 API Docs: Ver aba "Instruções" ao criar integração

---

**Última atualização:** Versão 2.0 (Chrome Extension removida)
