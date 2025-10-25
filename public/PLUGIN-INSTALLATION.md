# 📦 Instalação do Plugin Rankito LeadGen

## Como Criar o Arquivo ZIP do Plugin

Para distribuir o plugin, você precisa criar um arquivo ZIP com a estrutura correta:

### Método 1: Manualmente (Windows/Mac/Linux)

1. Navegue até a pasta `public/plugins/`
2. Selecione a pasta `rankito-leadgen`
3. Clique com botão direito → "Comprimir" / "Criar arquivo ZIP"
4. Renomeie para `rankito-leadgen.zip`
5. Mova o arquivo .zip para `public/` para disponibilizar o download

### Método 2: Via Terminal (Linux/Mac)

```bash
cd public/plugins/
zip -r ../rankito-leadgen.zip rankito-leadgen/
```

### Método 3: Via PowerShell (Windows)

```powershell
cd public/plugins/
Compress-Archive -Path rankito-leadgen -DestinationPath ../rankito-leadgen.zip
```

## Estrutura do ZIP Final

O arquivo `rankito-leadgen.zip` deve conter:

```
rankito-leadgen/
├── rankito-leadgen.php
├── readme.txt
├── assets/
│   ├── css/
│   │   ├── admin.css
│   │   └── frontend.css
│   └── js/
│       ├── admin.js
│       └── frontend.js
├── includes/
│   ├── class-admin.php
│   └── class-frontend.php
└── templates/
    ├── admin-settings.php
    └── modal-template.php
```

## Instruções para o Usuário Final

### Instalação no WordPress

1. **Baixar o Plugin**
   - Acesse o Dashboard → Integrações
   - Clique em "Baixar Plugin" no card do Rankito LeadGen
   - Salve o arquivo `rankito-leadgen.zip`

2. **Instalar no WordPress**
   - Acesse: WordPress Admin → Plugins → Adicionar Novo
   - Clique em "Enviar Plugin"
   - Selecione o arquivo `rankito-leadgen.zip`
   - Clique em "Instalar Agora"
   - Clique em "Ativar Plugin"

3. **Configurar**
   - Aparecerá "Rankito LeadGen" no menu lateral
   - Clique para acessar as configurações
   - Cole a URL da API e o Token (da integração criada no RankiTO)
   - Teste a conexão
   - Personalize visual, campos e mensagens
   - Salve as configurações

4. **Publicar no Site**
   - Se escolheu "Botão Flutuante": Aparecerá automaticamente
   - Se escolheu "Shortcode": Use `[rankito_button]` onde desejar
   - Teste preenchendo o formulário

### Primeiros Passos Após Instalação

✅ **Passo 1:** Criar integração no RankiTO (Dashboard → Integrações → Nova Integração)
✅ **Passo 2:** Copiar URL da API e Token
✅ **Passo 3:** Colar no plugin WordPress (Rankito LeadGen → Integração RankiTO)
✅ **Passo 4:** Testar conexão (botão "Testar Conexão")
✅ **Passo 5:** Configurar estágio padrão (CRM → Auto-Conversão)
✅ **Passo 6:** Personalizar visual e campos
✅ **Passo 7:** Testar captura de lead

## Troubleshooting

### Erro: "Plugin não pode ser ativado"
- **Causa:** Versão do PHP muito antiga
- **Solução:** Atualize para PHP 7.4 ou superior

### Erro: "Token inválido"
- **Causa:** Token copiado incorretamente ou integração desativada
- **Solução:** Copie novamente o token completo e verifique se a integração está ativa

### Modal não abre
- **Causa:** Conflito com outros plugins ou cache
- **Solução:** Limpe o cache do WordPress e do navegador. Desative outros plugins para testar.

## Atualizações Futuras

Para atualizar o plugin:

1. Desative o plugin atual
2. Exclua o plugin antigo
3. Instale a nova versão
4. Ative novamente
5. Suas configurações serão preservadas

## Suporte

- **Email:** suporte@rankito.com
- **Documentação:** https://rankito.com/docs
- **Discord:** https://discord.gg/rankito
