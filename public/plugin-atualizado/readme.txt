=== Rank & Rent Tracker ===
Contributors: seunome
Tags: tracking, analytics, rank and rent, conversions
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 2.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Rastreamento automático e inteligente de conversões para sites Rank & Rent com logs detalhados para debug.

== Description ==

O Rank & Rent Tracker é um plugin poderoso que rastreia automaticamente interações dos visitantes no seu site WordPress e envia os dados para um sistema central de análise.

**Versão 2.0 - Novidades:**

* ✅ Substituído sendBeacon por Fetch API com tratamento completo de erros
* ✅ Logs extremamente detalhados no console do navegador
* ✅ KeepAlive para garantir envio de dados mesmo ao sair da página
* ✅ Melhor detecção de erros de CORS e rede
* ✅ Interface de debug aprimorada

**Funcionalidades:**

* Rastreamento automático de pageviews
* Detecção de cliques em telefone
* Detecção de cliques em email  
* Detecção de cliques em WhatsApp
* Rastreamento de envios de formulários
* Detecção automática de tipo de dispositivo (mobile/desktop)
* Extração automática de números de telefone da página
* Sistema completo de logs para debug
* Teste de conexão integrado

== Installation ==

1. Faça upload da pasta `rank-rent-tracker` para o diretório `/wp-content/plugins/`
2. Ative o plugin através do menu 'Plugins' no WordPress
3. Vá para Configurações > Rank & Rent Tracker
4. Cole a URL de rastreamento fornecida pelo sistema
5. Clique em "Salvar Configurações"
6. Clique em "Testar Agora" para validar a conexão

== Frequently Asked Questions ==

= Como sei se o plugin está funcionando? =

Abra o console do navegador (F12) e procure por mensagens com prefixo `[Rank&Rent]`. Você deve ver:
- `✅ [Rank&Rent] Plugin v2.0 inicializado`
- `📊 [Rank&Rent] Registrando pageview automático...`
- `✅ [Rank&Rent] Sucesso!`

= O que fazer se aparecer erro no console? =

Copie toda a mensagem de erro que aparece no console (aquela com `❌ [Rank&Rent] ERRO`) e envie para o suporte junto com:
- A URL do seu site
- O navegador que está usando
- O que você clicou quando o erro ocorreu

= Como debugar conversões que não aparecem? =

1. Abra o site e pressione F12
2. Vá na aba "Console"
3. Clique no botão de WhatsApp/telefone
4. Verifique os logs com `[Rank&Rent]`
5. Se aparecer `✅ Sucesso!`, o plugin está funcionando
6. Se aparecer erro, copie a mensagem completa

= O plugin afeta a performance do site? =

Não. O plugin é extremamente leve e usa `keepalive: true` para garantir que o tracking não bloqueie a navegação.

= Posso remover os logs em produção? =

Os logs são essenciais para debug. Eles só aparecem no console do desenvolvedor (F12) e não são visíveis para visitantes normais.

== Changelog ==

= 2.0.0 =
* IMPORTANTE: Substituído navigator.sendBeacon() por Fetch API
* Adicionado sistema completo de logs no console
* Adicionado tratamento detalhado de erros
* Adicionado keepalive para garantir envio
* Melhorada detecção de tipos de conversão
* Adicionado debug de payload completo
* Melhorada interface de configuração

= 1.0.0 =
* Versão inicial

== Upgrade Notice ==

= 2.0.0 =
Atualização crítica! Corrige problema de conversões não sendo enviadas. Atualizar imediatamente.

== Debug ==

Para ver logs detalhados:

1. Abra seu site WordPress
2. Pressione F12 (abre Console do Desenvolvedor)
3. Clique na aba "Console"
4. Recarregue a página
5. Procure por mensagens com `[Rank&Rent]`

Logs esperados:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [Rank&Rent] Plugin v2.0 inicializado
📍 [Rank&Rent] Tracking URL: https://...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ao clicar em WhatsApp:
```
🖱️ [Rank&Rent] Click detectado: {...}
   💬 [Rank&Rent] Tipo: WHATSAPP
🚀 [Rank&Rent] Tracking Event
   📦 Payload completo: {...}
✅ [Rank&Rent] Sucesso!
```
