# 🚀 Guia Completo de Deployment - Extensão WhatsApp

Este guia cobre todos os passos necessários para colocar a extensão em produção.

---

## ✅ Checklist Pré-Deployment

Antes de começar, confirme que você tem:

- [x] Backend (3 Edge Functions) → Já deployados automaticamente
- [x] Frontend (`/extension-setup` + `ChromeExtensionSetup`) → Já no código
- [x] Extensão Chrome completa → Pasta `chrome-extension/` pronta
- [x] Ícone base 512x512 → `assets/icon-source.png` criado
- [ ] **3 ícones PNG** (16, 48, 128) → **VOCÊ PRECISA GERAR**
- [ ] **Bucket no Storage** → **VOCÊ PRECISA CRIAR**
- [ ] **Upload da extensão** → **VOCÊ VAI FAZER**
- [ ] **Link de download atualizado** → **ÚLTIMA ETAPA**

---

## 📋 PASSO 1: Gerar os 3 Ícones

### Método Rápido (Recomendado) ⚡

```bash
cd chrome-extension/assets
open generate-icons.html  # Ou abra manualmente no navegador
```

No navegador:
1. Clique em **"Baixar TODOS os Ícones"**
2. Salve os 3 arquivos PNG na pasta `chrome-extension/assets/`:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### Métodos Alternativos

**Online (sem instalar nada):**
- Acesse: https://www.iloveimg.com/resize-image
- Upload `icon-source.png`
- Redimensione para 128x128, 48x48 e 16x16
- Baixe e renomeie os arquivos

**ImageMagick (linha de comando):**
```bash
cd chrome-extension/assets
magick icon-source.png -resize 128x128 icon128.png
magick icon-source.png -resize 48x48 icon48.png
magick icon-source.png -resize 16x16 icon16.png
```

**Verificar:** Você deve ter 4 arquivos PNG na pasta `assets/`:
- ✅ icon-source.png (512x512)
- ✅ icon128.png (128x128)
- ✅ icon48.png (48x48)
- ✅ icon16.png (16x16)

---

## 📦 PASSO 2: Compactar a Extensão

```bash
cd chrome-extension
zip -r rankito-whatsapp-extension.zip * -x "*.md" -x "*.html"
```

**Windows (PowerShell):**
```powershell
Compress-Archive -Path chrome-extension\* -DestinationPath rankito-whatsapp-extension.zip
```

**Verificar:** O arquivo `rankito-whatsapp-extension.zip` deve ter ~20-50 KB

---

## ☁️ PASSO 3: Criar Bucket no Supabase Storage

1. Acesse o backend do projeto:
   - Na interface do Lovable, clique no botão **"Backend"** (ou Storage)

2. Navegue até **Storage** no menu lateral

3. Clique em **"New bucket"**

4. Configure o bucket:
   - **Name:** `extensions`
   - **Public bucket:** ✅ **MARQUE COMO PÚBLICO**
   - **File size limit:** 10 MB (suficiente)
   - **Allowed MIME types:** `application/zip, application/x-zip-compressed`

5. Clique em **"Create bucket"**

---

## 📤 PASSO 4: Upload da Extensão

1. No Supabase Storage, abra o bucket **`extensions`**

2. Clique em **"Upload file"**

3. Selecione o arquivo `rankito-whatsapp-extension.zip`

4. Após o upload, **copie a URL pública** do arquivo:
   - Clique no arquivo
   - Clique em **"Copy URL"** ou **"Get public URL"**
   
   A URL será algo como:
   ```
   https://jhzmgexprjnpgadkxjup.supabase.co/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip
   ```

5. **SALVE ESSA URL** - você vai precisar dela no próximo passo!

---

## 🔗 PASSO 5: Atualizar Link de Download no Código

Abra o arquivo `src/components/integrations/ChromeExtensionSetup.tsx` e localize a linha ~81:

```tsx
// ANTES (placeholder)
<a 
  href="https://jhzmgexprjnpgadkxjup.supabase.co/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip"
  download
>

// DEPOIS (cole a URL que você copiou)
<a 
  href="SUA_URL_COPIADA_AQUI"
  download
>
```

**Exemplo real:**
```tsx
<a 
  href="https://jhzmgexprjnpgadkxjup.supabase.co/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip"
  download
>
```

Salve o arquivo e espere o preview atualizar (rebuild automático).

---

## 🧪 PASSO 6: Testar Localmente (Antes de Distribuir)

### Instalar a Extensão no Chrome

1. Abra o Chrome e vá para: `chrome://extensions/`

2. Ative o **"Modo do desenvolvedor"** (toggle no canto superior direito)

3. Clique em **"Carregar sem compactação"**

4. Selecione a pasta `chrome-extension/` do seu projeto

5. A extensão será instalada com o ícone que você criou

### Configurar Token

1. A extensão deve abrir automaticamente a página `/extension-setup`

2. No Rankito:
   - Vá em **Dashboard → Integrações**
   - Clique em **"Nova Integração"**
   - Selecione **"Extensão Chrome (WhatsApp)"**
   - Copie o token gerado

3. Cole o token na página de configuração

4. Clique em **"Conectar Extensão"**

### Testar no WhatsApp Web

1. Abra: https://web.whatsapp.com

2. Faça login (se necessário)

3. A **sidebar do Rankito** deve aparecer à direita

4. Abra qualquer conversa e:
   - Verifique se o nome/telefone aparece
   - Verifique se o histórico carrega (se houver)
   - Clique em **"🔥 Criar Lead no CRM"**
   - Confirme que o lead foi criado no Dashboard → CRM

5. Verifique o **badge do ícone** da extensão:
   - 🟢 (verde com ✓) = Conectado
   - 🔴 (vermelho com !) = Desconectado

---

## ✅ PASSO 7: Distribuir para Usuários

### Opção A: Download Direto (Recomendado para MVP)

1. No Dashboard → Integrações, usuários verão o card **"Extensão Chrome - WhatsApp Web"**

2. Eles podem:
   - Baixar o .zip
   - Seguir as instruções de instalação
   - Configurar o token

**Prós:**
- ✅ Rápido e simples
- ✅ Sem custos
- ✅ Controle total

**Contras:**
- ⚠️ Usuários precisam ativar "Modo desenvolvedor"
- ⚠️ Chrome pode mostrar aviso sobre extensões não verificadas

### Opção B: Chrome Web Store (Produção)

Para publicar oficialmente no Chrome Web Store:

1. **Preparar assets:**
   - Screenshots da extensão em uso (1280x800 ou 640x400)
   - Ícone promocional 440x280
   - Descrição detalhada em português
   - Política de privacidade (URL pública)

2. **Criar conta de desenvolvedor:**
   - Acesse: https://chrome.google.com/webstore/devconsole
   - Taxa única de $5 USD

3. **Submeter extensão:**
   - Upload do .zip
   - Preencher detalhes
   - Aguardar revisão (1-3 dias úteis)

4. **Após aprovação:**
   - Extensão fica disponível publicamente
   - Usuários instalam com 1 clique
   - Updates automáticos

---

## 🔧 Troubleshooting

### Extensão não aparece no WhatsApp Web

**Causas:**
- WhatsApp Web não carregou completamente
- Content script teve erro

**Solução:**
1. F12 → Console
2. Procure por `[Rankito Content]` nos logs
3. Recarregue a página do WhatsApp

### Badge sempre vermelho (desconectado)

**Causas:**
- Token inválido ou expirado
- API não está respondendo

**Solução:**
1. Clique no ícone da extensão
2. Reabra `/extension-setup`
3. Cole um novo token
4. Teste a conexão

### Histórico não carrega

**Causas:**
- Telefone não está visível no WhatsApp
- Não há deals com esse telefone

**Solução:**
- Abra a conversa completamente
- Aguarde alguns segundos
- O WhatsApp Web nem sempre mostra o telefone no DOM

### Erro ao criar lead

**Causas:**
- Token sem permissão
- Campos obrigatórios faltando

**Solução:**
1. Verifique os logs da Edge Function `create-deal-from-whatsapp`
2. Confirme que a integração está ativa no Dashboard
3. Teste criar um deal manualmente no CRM

---

## 📊 Monitoramento

### Logs das Edge Functions

No backend (Cloud), acesse **Edge Functions** → Selecione a função:

1. **create-deal-from-whatsapp** - Logs de criação de leads
2. **get-whatsapp-history** - Logs de busca de histórico
3. **link-whatsapp-to-client** - Logs de vinculação

### Estatísticas de Uso

No Dashboard → Integrações:
- Total de leads capturados
- Leads nos últimos 7 dias
- Última sincronização

---

## 🎉 Pronto para Produção!

Após completar todos os passos acima:

- ✅ Extensão instalada e funcionando
- ✅ Token configurado
- ✅ Leads sendo capturados do WhatsApp
- ✅ Histórico sincronizado com CRM
- ✅ Distribuição configurada

**Próximos passos sugeridos:**

1. Treinar equipe sobre como usar a extensão
2. Criar documentação interna
3. Monitorar métricas de uso
4. Coletar feedback dos usuários
5. Considerar publicação no Chrome Web Store

---

## 📞 Suporte

Em caso de dúvidas:
1. Verifique os logs das Edge Functions
2. Consulte o README.md principal
3. Revise este DEPLOYMENT.md

**Boa sorte! 🚀**
