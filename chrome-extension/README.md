# Rankito CRM - WhatsApp Web Extension

Extensão Chrome para capturar leads do WhatsApp Web direto para o Rankito CRM.

## 📦 Como Empacotar para Distribuição

### 1. Preparar os ícones

Você precisa criar 3 ícones PNG na pasta `assets/`:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

**Dica:** Use uma ferramenta como [RealFaviconGenerator](https://realfavicongenerator.net/) para gerar os ícones automaticamente.

### 2. Compactar a extensão

Crie um arquivo .zip com **todo o conteúdo da pasta `chrome-extension/`**:

```bash
cd chrome-extension
zip -r ../rankito-whatsapp-extension.zip *
```

**IMPORTANTE:** Não compacte a pasta `chrome-extension` em si, apenas seu conteúdo!

### 3. Upload no Supabase Storage

Após compactar, faça upload do .zip para o Supabase Storage:

1. Acesse o backend (Cloud)
2. Vá em **Storage**
3. Crie um bucket público chamado `extensions` (se não existir)
4. Faça upload do arquivo `rankito-whatsapp-extension.zip`
5. Copie a URL pública do arquivo

### 4. Atualizar o link de download

No componente `ChromeExtensionSetup.tsx`, atualize a URL:

```tsx
<a 
  href="https://[SEU-PROJECT-ID].supabase.co/storage/v1/object/public/extensions/rankito-whatsapp-extension.zip"
  download
>
```

## 🚀 Como Instalar (Usuários Finais)

1. Baixe o arquivo .zip
2. Extraia para uma pasta
3. Abra `chrome://extensions/`
4. Ative "Modo do desenvolvedor"
5. Clique em "Carregar sem compactação"
6. Selecione a pasta extraída
7. Configure o token na página que abrir automaticamente

## 📁 Estrutura de Arquivos

```
chrome-extension/
├── manifest.json              # Configuração da extensão
├── background/
│   └── service-worker.js      # Script de background
├── content/
│   ├── content.js             # Script injetado no WhatsApp Web
│   └── sidebar.css            # Estilos da sidebar
├── assets/
│   ├── icon16.png             # Ícone 16x16
│   ├── icon48.png             # Ícone 48x48
│   └── icon128.png            # Ícone 128x128
└── README.md                  # Este arquivo
```

## 🔧 Desenvolvimento Local

Para testar a extensão localmente:

1. Abra `chrome://extensions/`
2. Ative "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `chrome-extension/`
5. Abra o WhatsApp Web para testar

## 🐛 Debugging

- **Console do Background Script:** `chrome://extensions/` → "inspecionar views: service worker"
- **Console do Content Script:** F12 no WhatsApp Web → Console
- **Logs:** Todos os logs começam com `[Rankito]`

## 📝 Notas

- A extensão só funciona em `web.whatsapp.com`
- Requer token válido da API do Rankito CRM
- Badge do ícone mostra status: 🟢 (conectado) ou 🔴 (desconectado)
