=== Rank & Rent Tracker ===
Contributors: Anderson Melo SEO
Tags: tracking, analytics, conversion, rank and rent
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later

Rastreamento automático de conversões para Rankito CRM.

== Description ==

O Rank & Rent Tracker permite rastrear automaticamente todas as interações dos visitantes no seu site:

* 📊 **Page Views** - Registra cada visualização de página
* 📱 **Cliques em WhatsApp** - Detecta quando visitantes clicam em links do WhatsApp
* ☎️ **Cliques em Telefone** - Rastreia cliques em números de telefone
* ✉️ **Cliques em Email** - Monitora cliques em endereços de email
* 🎯 **Cliques em Botões** - Registra cliques em CTAs e botões
* 📝 **Envio de Formulários** - Detecta submissões de formulários

Todos os dados são enviados automaticamente para o Rankito CRM, permitindo análise completa do comportamento dos visitantes.

== Installation ==

1. Faça upload do plugin para `/wp-content/plugins/rank-rent-tracker/`
2. Ative o plugin no menu 'Plugins' do WordPress
3. Acesse Configurações > Rank & Rent Tracker
4. Cole a URL de rastreamento fornecida pelo Rankito CRM
5. Clique em "Testar Conexão" para verificar
6. Salve as configurações

A URL de rastreamento tem o formato:
`https://app.rankitocrm.com/functions/v1/api-track?token=SEU_TOKEN_AQUI`

== Frequently Asked Questions ==

= Onde encontro a URL de rastreamento? =

Acesse o Rankito CRM, vá em Sites > [Seu Site] > copie a URL de rastreamento.

= O plugin afeta a velocidade do site? =

Não! O rastreamento é assíncrono e não bloqueia o carregamento da página.

= Posso rastrear múltiplos sites? =

Sim, cada site WordPress precisa ter o plugin instalado com seu próprio token único.

= Os dados são enviados em tempo real? =

Sim, todos os eventos são enviados imediatamente ao Rankito CRM.

== Changelog ==

= 1.0.0 =
* Versão inicial
* Rastreamento automático de page views
* Detecção de cliques (WhatsApp, telefone, email, botões)
* Rastreamento de formulários
* Painel de configuração simplificado
* Teste de conexão integrado
