# 📱 Extensão WhatsApp - Guia Rápido de Ativação

## 🎯 O que você precisa fazer AGORA

### 1️⃣ Gerar os Ícones (2 minutos)

```bash
cd chrome-extension/assets
open generate-icons.html
```

**No navegador que abrir:**
- Clique em "⬇️ Baixar TODOS os Ícones"
- Salve os 3 arquivos PNG na pasta `chrome-extension/assets/`

**Você deve ter:**
- ✅ icon16.png (16x16)
- ✅ icon48.png (48x48)
- ✅ icon128.png (128x128)

---

### 2️⃣ Compactar a Extensão (1 minuto)

```bash
cd chrome-extension
zip -r rankito-whatsapp-extension.zip *
```

**Windows:**
```powershell
Compress-Archive -Path chrome-extension\* -DestinationPath rankito-whatsapp-extension.zip
```

---

### 3️⃣ Criar Bucket no Storage (2 minutos)

1. **Abra o Backend** (botão no topo da interface)
2. **Storage** → **New bucket**
3. Configure:
   - Name: `extensions`
   - Public: ✅ **SIM** (marque como público)
   - Size limit: 10 MB
4. **Create bucket**

---

### 4️⃣ Upload da Extensão (1 minuto)

1. Abra o bucket `extensions`
2. **Upload file** → Selecione `rankito-whatsapp-extension.zip`
3. **COPIE A URL PÚBLICA** do arquivo (vai precisar!)

Exemplo de URL:
```
https://jhzmgexprjnpgadkxjup.supabase.co/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip
```

---

### 5️⃣ Atualizar Link de Download (1 minuto)

Abra: `src/components/integrations/ChromeExtensionSetup.tsx`

**Linha ~81 (procure por "href="):**

```tsx
// ANTES
<a 
  href="https://jhzmgexprjnpgadkxjup.supabase.co/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip"
  download
>

// DEPOIS - Cole sua URL
<a 
  href="SUA_URL_COPIADA_DO_STORAGE_AQUI"
  download
>
```

Salve e aguarde o rebuild automático.

---

## ✅ Testar se Funcionou

### No Dashboard:

1. **Integrações** → **Nova Integração**
2. Selecione: **"Extensão Chrome (WhatsApp)"**
3. Copie o token gerado
4. Clique em **"Abrir Página de Configuração"**

### Instalar a Extensão:

1. Baixe o .zip (botão que você acabou de configurar)
2. Extraia a pasta
3. `chrome://extensions/` → Ative "Modo desenvolvedor"
4. **"Carregar sem compactação"** → Selecione a pasta
5. Cole o token na página que abrir
6. Clique em **"Conectar Extensão"**

### No WhatsApp Web:

1. Abra: https://web.whatsapp.com
2. A **sidebar do Rankito** deve aparecer à direita
3. Abra qualquer conversa
4. Clique em **"🔥 Criar Lead no CRM"**
5. Verifique no Dashboard → CRM se o lead foi criado

---

## 🎉 Pronto!

Se tudo funcionou:
- ✅ Badge do ícone verde (🟢)
- ✅ Sidebar aparecendo no WhatsApp
- ✅ Leads sendo criados no CRM
- ✅ Histórico sincronizando

---

## 📚 Documentação Completa

Para detalhes avançados, troubleshooting e publicação no Chrome Web Store:
- **`chrome-extension/DEPLOYMENT.md`** - Guia completo
- **`chrome-extension/README.md`** - Docs da extensão
- **`chrome-extension/assets/COMO-GERAR-ICONES.md`** - Métodos alternativos

---

**Tempo total estimado: 7-10 minutos** ⏱️

**Boa sorte! 🚀**
