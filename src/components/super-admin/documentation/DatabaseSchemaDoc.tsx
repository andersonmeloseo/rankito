import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Shield, Zap, Users, Globe, DollarSign, MessageSquare, FileText } from "lucide-react";

export const DatabaseSchemaDoc = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estrutura do Banco de Dados
          </CardTitle>
          <CardDescription>66 tabelas organizadas por módulo</CardDescription>
        </CardHeader>
      </Card>

      {/* Core Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Core - Usuários & Autenticação
            <Badge variant="secondary">4 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">profiles</TableCell>
                <TableCell>Perfis de usuários</TableCell>
                <TableCell className="text-xs">id, email, full_name, is_active, theme, whatsapp, phone</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">user_roles</TableCell>
                <TableCell>Papéis (client, super_admin, end_client)</TableCell>
                <TableCell className="text-xs">user_id, role</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">user_subscriptions</TableCell>
                <TableCell>Assinaturas ativas</TableCell>
                <TableCell className="text-xs">user_id, plan_id, status, trial_end_date</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">subscription_plans</TableCell>
                <TableCell>Planos disponíveis</TableCell>
                <TableCell className="text-xs">name, slug, price, max_sites, max_pages_per_site, trial_days</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sites & Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Sites & Tracking
            <Badge variant="secondary">6 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_sites</TableCell>
                <TableCell>Sites/projetos cadastrados</TableCell>
                <TableCell className="text-xs">site_name, site_url, owner_user_id, is_rented, is_ecommerce</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_pages</TableCell>
                <TableCell>Páginas dos sites</TableCell>
                <TableCell className="text-xs">site_id, page_url, page_title, is_rented, cta_config</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_conversions</TableCell>
                <TableCell>Eventos de conversão</TableCell>
                <TableCell className="text-xs">site_id, event_type, metadata, session_id, city, country</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_sessions</TableCell>
                <TableCell>Sessões de visitantes</TableCell>
                <TableCell className="text-xs">session_id, site_id, entry_page, exit_page, total_duration_seconds</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_page_visits</TableCell>
                <TableCell>Visitas por página</TableCell>
                <TableCell className="text-xs">session_id, page_url, sequence_number, time_spent_seconds</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_clients</TableCell>
                <TableCell>Clientes dos sites</TableCell>
                <TableCell className="text-xs">user_id, name, email, phone, access_token</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CRM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            CRM
            <Badge variant="secondary">6 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">crm_deals</TableCell>
                <TableCell>Deals/negociações</TableCell>
                <TableCell className="text-xs">title, stage, value, probability, contact_name, lead_score</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">crm_activities</TableCell>
                <TableCell>Atividades do deal</TableCell>
                <TableCell className="text-xs">deal_id, activity_type, title, description, metadata</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">crm_notes</TableCell>
                <TableCell>Notas dos deals</TableCell>
                <TableCell className="text-xs">deal_id, content, is_pinned</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">crm_tasks</TableCell>
                <TableCell>Tarefas do CRM</TableCell>
                <TableCell className="text-xs">deal_id, title, type, due_date, status, priority</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">crm_pipeline_stages</TableCell>
                <TableCell>Estágios do pipeline</TableCell>
                <TableCell className="text-xs">stage_key, label, color, display_order, is_active</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">crm_email_templates</TableCell>
                <TableCell>Templates de email</TableCell>
                <TableCell className="text-xs">name, subject, body, type, is_default</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GSC & Indexação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Google Search Console & Indexação
            <Badge variant="secondary">10 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">google_search_console_integrations</TableCell>
                <TableCell>Integrações GSC</TableCell>
                <TableCell className="text-xs">site_id, connection_name, service_account_json, health_status</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_discovered_urls</TableCell>
                <TableCell>URLs descobertas</TableCell>
                <TableCell className="text-xs">site_id, url, current_status, impressions, clicks, position</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_url_indexing_requests</TableCell>
                <TableCell>Requisições de indexação</TableCell>
                <TableCell className="text-xs">integration_id, url, status, error_message, response_data</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_indexing_alerts</TableCell>
                <TableCell>Alertas de indexação</TableCell>
                <TableCell className="text-xs">site_id, alert_type, severity, message, metadata</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_sitemap_submissions</TableCell>
                <TableCell>Submissões de sitemap</TableCell>
                <TableCell className="text-xs">site_id, sitemap_url, gsc_status, page_count, errors_count</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_scheduled_submissions</TableCell>
                <TableCell>Submissões agendadas</TableCell>
                <TableCell className="text-xs">site_id, scheduled_for, submission_type, urls, status</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_schedule_config</TableCell>
                <TableCell>Configurações de agendamento</TableCell>
                <TableCell className="text-xs">site_id, frequency, max_urls_per_run, enabled</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_search_analytics</TableCell>
                <TableCell>Analytics do GSC</TableCell>
                <TableCell className="text-xs">site_id, query, page, clicks, impressions, ctr, position</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">gsc_indexing_jobs</TableCell>
                <TableCell>Jobs de indexação</TableCell>
                <TableCell className="text-xs">site_id, job_type, status, urls_processed, urls_successful</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">indexnow_submissions</TableCell>
                <TableCell>Submissões IndexNow</TableCell>
                <TableCell className="text-xs">site_id, urls_count, status, status_code, response_data</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Suporte & Comunicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Suporte & Comunicação
            <Badge variant="secondary">3 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">support_tickets</TableCell>
                <TableCell>Tickets de suporte</TableCell>
                <TableCell className="text-xs">user_id, subject, category, status, priority, assigned_to</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">support_messages</TableCell>
                <TableCell>Mensagens dos tickets</TableCell>
                <TableCell className="text-xs">ticket_id, message, is_admin_reply, is_internal_note</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">user_notifications</TableCell>
                <TableCell>Notificações</TableCell>
                <TableCell className="text-xs">user_id, type, title, message, read, link, metadata</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Financeiro
            <Badge variant="secondary">3 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">subscription_payments</TableCell>
                <TableCell>Pagamentos</TableCell>
                <TableCell className="text-xs">subscription_id, amount, status, payment_date, payment_method</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">subscription_history</TableCell>
                <TableCell>Histórico de assinaturas</TableCell>
                <TableCell className="text-xs">subscription_id, action, old_values, new_values, changed_by</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">rank_rent_financial_config</TableCell>
                <TableCell>Config financeira dos sites</TableCell>
                <TableCell className="text-xs">site_id, cost_per_conversion, monthly_fixed_costs, business_model</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Admin & Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Administração & Logs
            <Badge variant="secondary">5 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">admin_audit_logs</TableCell>
                <TableCell>Logs de auditoria admin</TableCell>
                <TableCell className="text-xs">admin_user_id, action, target_user_id, details, ip_address</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">admin_automation_rules</TableCell>
                <TableCell>Regras de automação</TableCell>
                <TableCell className="text-xs">rule_name, rule_type, conditions, actions, is_active</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">automation_execution_logs</TableCell>
                <TableCell>Logs de execução</TableCell>
                <TableCell className="text-xs">rule_id, execution_status, execution_details, error_message</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">geolocation_api_configs</TableCell>
                <TableCell>Configs de APIs geolocalização</TableCell>
                <TableCell className="text-xs">provider_name, api_key, priority, usage_count, is_active</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">mapbox_usage_tracking</TableCell>
                <TableCell>Tracking de uso Mapbox</TableCell>
                <TableCell className="text-xs">user_id, map_loads_count, limit_reached, month_year</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-pink-600" />
            Marketing & Leads
            <Badge variant="secondary">3 tabelas</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campos Principais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">early_access_leads</TableCell>
                <TableCell>Leads de early access</TableCell>
                <TableCell className="text-xs">full_name, email, whatsapp, main_pain, status, utm_params</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">marketing_campaigns</TableCell>
                <TableCell>Campanhas de marketing</TableCell>
                <TableCell className="text-xs">name, channel, budget_total, budget_spent, utm_campaign</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">marketing_metrics</TableCell>
                <TableCell>Métricas de marketing</TableCell>
                <TableCell className="text-xs">campaign_id, metric_type, value, date, source</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Database Functions */}
      <Card>
        <CardHeader>
          <CardTitle>Funções do Banco de Dados</CardTitle>
          <CardDescription>30+ funções SQL para lógica de negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">handle_new_user()</div>
              <div className="text-xs text-muted-foreground">Trigger para novos usuários</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">has_role(user_id, role)</div>
              <div className="text-xs text-muted-foreground">Verifica role do usuário</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">validate_site_limit()</div>
              <div className="text-xs text-muted-foreground">Valida limite de sites por plano</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">validate_page_limit()</div>
              <div className="text-xs text-muted-foreground">Valida limite de páginas por plano</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">log_deal_activity()</div>
              <div className="text-xs text-muted-foreground">Loga atividades do CRM</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">update_contract_statuses()</div>
              <div className="text-xs text-muted-foreground">Atualiza status de contratos</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">get_database_health_metrics()</div>
              <div className="text-xs text-muted-foreground">Métricas de saúde do DB</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-mono text-sm font-semibold">get_top_users_by_consumption()</div>
              <div className="text-xs text-muted-foreground">Top usuários por consumo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Total:</strong> 66 tabelas organizadas em 8 módulos principais + 12 views SQL + 30+ funções de banco de dados. 
            Todas as tabelas possuem RLS policies configuradas para segurança em nível de linha.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};