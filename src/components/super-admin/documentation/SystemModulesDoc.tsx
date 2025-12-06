import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Search, Zap, MessageSquare, FileText, CreditCard, Layers, Target } from "lucide-react";

export const SystemModulesDoc = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Módulos do Sistema</CardTitle>
          <CardDescription>Documentação detalhada de cada módulo funcional</CardDescription>
        </CardHeader>
      </Card>

      {/* Módulo de Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            1. Módulo de Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Pixel JavaScript (rankito-pixel.js)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Script de tracking universal instalado via tag &lt;script&gt; em qualquer site
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Session Tracking</Badge>
              <Badge variant="secondary">Click Detection</Badge>
              <Badge variant="secondary">E-commerce Events</Badge>
              <Badge variant="secondary">Scroll Tracking</Badge>
              <Badge variant="secondary">Form Submission</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Plugin WordPress v2.0.0</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Plugin nativo para sites WordPress com integração completa
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Auto-injection</Badge>
              <Badge variant="secondary">Admin Dashboard</Badge>
              <Badge variant="secondary">Token Auth</Badge>
              <Badge variant="secondary">Real-time Sync</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Eventos Suportados</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>page_view:</strong> Visualização de página com session_id e sequence_number</li>
              <li>• <strong>page_exit:</strong> Saída da página com time_spent_seconds</li>
              <li>• <strong>whatsapp_click:</strong> Clique em link do WhatsApp</li>
              <li>• <strong>phone_click:</strong> Clique em número de telefone</li>
              <li>• <strong>email_click:</strong> Clique em link de email</li>
              <li>• <strong>button_click:</strong> Clique em botão/CTA genérico</li>
              <li>• <strong>product_view:</strong> Visualização de produto (e-commerce)</li>
              <li>• <strong>add_to_cart:</strong> Adicionar ao carrinho</li>
              <li>• <strong>remove_from_cart:</strong> Remover do carrinho</li>
              <li>• <strong>begin_checkout:</strong> Iniciar checkout</li>
              <li>• <strong>purchase:</strong> Compra finalizada com revenue</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Arquitetura</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Usuario → Pixel/Plugin → api-track Edge Function → rank_rent_conversions
                                                  → rank_rent_sessions
                                                  → rank_rent_page_visits`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Módulo GSC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />
            2. Módulo Google Search Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Autenticação</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Service Account JSON com JWT token generation on-demand
            </p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Service Account JSON → JWT Token → Google APIs
Scopes: webmasters + indexing`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quota Management</h4>
            <p className="text-sm text-muted-foreground">
              200 URLs/dia por integração. Sistema agrega múltiplas integrações automaticamente.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Funcionalidades</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>Instant Indexing:</strong> Submissão instantânea de URLs individuais</li>
              <li>• <strong>Sitemap Management:</strong> Submissão e monitoramento de sitemaps</li>
              <li>• <strong>Smart Scheduling:</strong> Agendamento inteligente com distribuição de quota</li>
              <li>• <strong>URL Discovery:</strong> Descoberta automática de URLs via Search Analytics</li>
              <li>• <strong>Status Monitoring:</strong> Verificação de status de indexação</li>
              <li>• <strong>Health Check:</strong> Monitoramento de saúde de integrações</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tabelas Principais</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">google_search_console_integrations</Badge>
              <Badge variant="outline">gsc_discovered_urls</Badge>
              <Badge variant="outline">gsc_url_indexing_requests</Badge>
              <Badge variant="outline">gsc_scheduled_submissions</Badge>
              <Badge variant="outline">gsc_schedule_config</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo IndexNow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            3. Módulo IndexNow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Integração com Bing/Yandex</h4>
            <p className="text-sm text-muted-foreground">
              Protocolo IndexNow para submissão instantânea de URLs aos motores de busca
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Validação de Chave</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Sistema gera chave única por site e valida acessibilidade via HTTP
            </p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`1. Gera chave única (hex)
2. Salva em rank_rent_sites.indexnow_key
3. Valida via GET https://[site-url]/[key].txt
4. Marca indexnow_validated=true`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Submissão em Batch</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Suporta até 10.000 URLs por requisição</li>
              <li>• Tracking de status por submissão</li>
              <li>• Separado completamente do GSC</li>
              <li>• Histórico em indexnow_submissions</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Edge Functions</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">indexnow-submit</Badge>
              <Badge variant="outline">indexnow-validate-key</Badge>
              <Badge variant="outline">indexnow-regenerate-key</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo CRM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            4. Módulo CRM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Pipeline Customizável</h4>
            <p className="text-sm text-muted-foreground">
              Estágios personalizáveis do pipeline armazenados em crm_pipeline_stages
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Lead Scoring Automático</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Pontuação automática baseada em interações (configurável em auto_conversion_settings)
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• WhatsApp Click: 80 pontos (padrão)</li>
              <li>• Phone Click: 70 pontos (padrão)</li>
              <li>• Form Submit: 90 pontos (padrão)</li>
              <li>• Email Click: 50 pontos (padrão)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Integração WhatsApp</h4>
            <p className="text-sm text-muted-foreground">
              API para criação de deals via mensagens WhatsApp externas
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Fontes Externas de Leads</h4>
            <p className="text-sm text-muted-foreground">
              Sistema de API tokens para importar leads de fontes externas (external_lead_sources)
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tabelas Principais</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">crm_deals</Badge>
              <Badge variant="outline">crm_activities</Badge>
              <Badge variant="outline">crm_notes</Badge>
              <Badge variant="outline">crm_tasks</Badge>
              <Badge variant="outline">crm_pipeline_stages</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            5. Módulo de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Formatos Suportados</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">PDF</Badge>
              <Badge variant="secondary">Excel</Badge>
              <Badge variant="secondary">HTML</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Portal do Cliente</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Interface pública para clientes visualizarem analytics sem login
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Acesso via token único</li>
              <li>• Customização de logo, cores, textos</li>
              <li>• Controle de features exibidas</li>
              <li>• Métricas filtradas por período</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Exportação de Dados</h4>
            <p className="text-sm text-muted-foreground">
              Sistema permite exportar dados analíticos em múltiplos formatos para análise externa
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Edge Functions</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">generate-pdf-report</Badge>
              <Badge variant="outline">generate-excel-report</Badge>
              <Badge variant="outline">generate-html-report</Badge>
              <Badge variant="outline">generate-client-report</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            6. Módulo de Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Planos Disponíveis</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Free</div>
                <div className="text-xs text-muted-foreground">0 trial days • 1 site • 10 páginas</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Starter</div>
                <div className="text-xs text-muted-foreground">7 trial days • 5 sites • 50 páginas</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Professional</div>
                <div className="text-xs text-muted-foreground">14 trial days • 15 sites • 200 páginas</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Enterprise</div>
                <div className="text-xs text-muted-foreground">30 trial days • Ilimitado • Ilimitado</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Trial Management</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Sistema automático de gestão de trials com notificações
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Notificação 3 dias antes da expiração</li>
              <li>• Bloqueio automático ao expirar</li>
              <li>• Banner de trial expirado no dashboard</li>
              <li>• Edge Function: check-expired-trials (diário)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Limites por Plano</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Validação automática via database functions
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">validate_site_limit()</Badge>
              <Badge variant="outline">validate_page_limit()</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Integração Stripe</h4>
            <p className="text-sm text-muted-foreground">
              Links de checkout Stripe configuráveis por plano (stripe_checkout_url)
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tabelas Principais</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">subscription_plans</Badge>
              <Badge variant="outline">user_subscriptions</Badge>
              <Badge variant="outline">subscription_payments</Badge>
              <Badge variant="outline">subscription_history</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo Backlog & Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            7. Backlog & Roadmap Público
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Kanban Board</h4>
            <p className="text-sm text-muted-foreground">
              Quadro Kanban com drag-and-drop (@dnd-kit) para gestão visual do backlog através dos estágios de desenvolvimento
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Solicitações de Funcionalidades</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Sistema completo de feedback com votação onde usuários podem sugerir melhorias
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Criação de solicitações com categoria e descrição</li>
              <li>• Sistema de votação (1 voto por usuário por solicitação)</li>
              <li>• Admin pode aceitar (cria no backlog) ou rejeitar</li>
              <li>• Notificação automática efusiva ao aceitar</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Roadmap Público</h4>
            <p className="text-sm text-muted-foreground">
              Timeline visual mostrando funcionalidades planejadas e implementadas (items com is_public=true)
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Funcionalidades Principais</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Drag & Drop</Badge>
              <Badge variant="outline">Barra de Progresso</Badge>
              <Badge variant="outline">Versões de Release</Badge>
              <Badge variant="outline">Timeline Público</Badge>
              <Badge variant="outline">Sistema de Votação</Badge>
              <Badge variant="outline">Notificações</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tabelas Principais</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">product_backlog</Badge>
              <Badge variant="outline">feature_requests</Badge>
              <Badge variant="outline">feature_request_votes</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulo de Tracking Avançado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            8. Módulo de Tracking Avançado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Metas de Conversão Personalizadas</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Sistema de metas customizáveis para definir o que realmente é conversão
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <strong>cta_match:</strong> Match por texto de CTA (parcial ou exato)</li>
              <li>• <strong>page_destination:</strong> Conversão por visita em URLs específicas</li>
              <li>• <strong>url_pattern:</strong> Regex patterns para URLs</li>
              <li>• <strong>combined:</strong> Combinação de múltiplos critérios</li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">Valor monetário por conversão</Badge>
              <Badge variant="secondary">CTAs auto-descobertos</Badge>
              <Badge variant="secondary">Prioridade de match</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Google Ads Offline Conversions</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Export CSV compatível com Google Ads Data Manager
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• GCLID tracking automático</li>
              <li>• Enhanced Conversions (email/phone SHA256)</li>
              <li>• Timezone e currency configuráveis</li>
              <li>• Consent fields (LGPD/GDPR)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Meta Conversions API (CAPI)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Envio direto de conversões para Meta via Server-Side API
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• fbclid, fbc, fbp tracking</li>
              <li>• User data hashing (SHA256)</li>
              <li>• Batch de até 1000 eventos</li>
              <li>• Modo teste integrado</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Dashboard de Campanhas</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Gerenciamento de campanhas UTM vinculadas a metas
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Detecção automática de campanhas via UTMs</li>
              <li>• Vínculo com metas de conversão</li>
              <li>• Métricas por campanha (views, conversões, valor)</li>
              <li>• Budget tracking</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Controle de Acesso</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Feature controlada por plano via has_advanced_tracking
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Toggle no Super Admin</Badge>
              <Badge variant="secondary">useFeatureAccess hook</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Edge Functions</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">export-google-ads-conversions</Badge>
              <Badge variant="outline">export-meta-conversions</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tabelas Principais</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">conversion_goals</Badge>
              <Badge variant="outline">marketing_campaign_configs</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Total:</strong> 8 módulos principais integrados formando um sistema completo de gestão de 
            Rank & Rent com analytics, indexação, CRM, relatórios, monetização, feedback de usuários e tracking avançado para Google Ads e Meta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};