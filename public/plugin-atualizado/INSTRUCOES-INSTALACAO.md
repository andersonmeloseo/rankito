# 📦 Instruções de Instalação - Rank & Rent Tracker v2.0

## 🗂️ Estrutura de Arquivos

Crie esta estrutura de pastas no seu computador:

```
rank-rent-tracker/
├── rank-rent-tracker.php
├── readme.txt
└── assets/
    └── admin.css
```

## 📝 Passo a Passo

### 1️⃣ Criar a Pasta Principal

No seu computador, crie uma pasta chamada `rank-rent-tracker`

### 2️⃣ Criar os Arquivos

Dentro da pasta `rank-rent-tracker`, crie estes arquivos:

#### Arquivo: `rank-rent-tracker.php`
- Copie todo o conteúdo do arquivo `rank-rent-tracker.php` fornecido
- Cole em um novo arquivo chamado `rank-rent-tracker.php`

#### Arquivo: `readme.txt`
- Copie todo o conteúdo do arquivo `readme.txt` fornecido
- Cole em um novo arquivo chamado `readme.txt`

### 3️⃣ Criar a Pasta Assets

Dentro da pasta `rank-rent-tracker`, crie uma nova pasta chamada `assets`

### 4️⃣ Criar o CSS

Dentro da pasta `assets`, crie o arquivo:

#### Arquivo: `assets/admin.css`
- Copie todo o conteúdo do arquivo `admin.css` fornecido
- Cole em um novo arquivo chamado `admin.css`

### 5️⃣ Criar o ZIP

1. Selecione a pasta `rank-rent-tracker` (não entre dentro dela, selecione a pasta toda)
2. Clique com botão direito > "Comprimir" ou "Enviar para > Pasta compactada"
3. Isso criará um arquivo `rank-rent-tracker.zip`

**IMPORTANTE:** A estrutura dentro do ZIP deve ser:
```
rank-rent-tracker.zip
└── rank-rent-tracker/
    ├── rank-rent-tracker.php
    ├── readme.txt
    └── assets/
        └── admin.css
```

### 6️⃣ Instalar no WordPress

1. Acesse seu WordPress Admin
2. Vá em **Plugins > Adicionar Novo**
3. Clique em **Fazer Upload de Plugin**
4. Clique em **Escolher Arquivo** e selecione o `rank-rent-tracker.zip`
5. Clique em **Instalar Agora**
6. Após a instalação, clique em **Ativar Plugin**

### 7️⃣ Configurar o Plugin

1. Vá em **Configurações > Rank & Rent Tracker**
2. Cole a URL de rastreamento que você copiou do sistema
3. Clique em **Salvar Configurações**
4. Clique em **Testar Agora** para validar a conexão
5. Deve aparecer: ✅ **"Conexão validada! Plugin funcionando corretamente."**

### 8️⃣ Testar no Site

1. Abra seu site em uma nova aba
2. Pressione **F12** para abrir o Console
3. Recarregue a página
4. Procure por estas mensagens:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [Rank&Rent] Plugin v2.0 inicializado
📍 [Rank&Rent] Tracking URL: https://...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

5. Clique em um botão do WhatsApp
6. Verifique se aparece:

```
🖱️ [Rank&Rent] Click detectado
   💬 [Rank&Rent] Tipo: WHATSAPP
🚀 [Rank&Rent] Tracking Event
✅ [Rank&Rent] Sucesso!
```

## ✅ Verificação Final

Após clicar no WhatsApp, verifique no dashboard do sistema se a conversão apareceu.

Se aparecer **✅ Sucesso!** no console MAS não aparecer no dashboard:
- Tire um print do console completo
- Envie para análise (pode ser problema no backend)

Se aparecer **❌ ERRO** no console:
- Copie TODA a mensagem de erro
- Envie junto com a URL do site

## 🆘 Problemas Comuns

### "O arquivo de plugin não tem cabeçalho válido"
- Certifique-se que o arquivo `rank-rent-tracker.php` está na raiz da pasta
- Verifique se o arquivo começa com `<?php` e tem o cabeçalho Plugin Name

### "Erro ao extrair o arquivo"
- Recrie o ZIP garantindo que a estrutura está correta
- A pasta `rank-rent-tracker` deve estar DENTRO do ZIP

### "Plugin instalado mas não funciona"
- Abra o console (F12) e procure por erros JavaScript
- Verifique se a URL de tracking está correta
- Teste a conexão na página de configurações

### Cache do WordPress
Se você tinha a versão antiga instalada:
1. Desative e delete o plugin antigo
2. Limpe o cache do WordPress (se tiver plugin de cache)
3. Instale a nova versão
4. Reconfigure a URL

## 📞 Suporte

Para suporte, forneça:
1. Print do console (F12) com os logs `[Rank&Rent]`
2. URL do seu site
3. Descrição do problema
4. Mensagem de erro completa (se houver)
