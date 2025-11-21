import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  metadata?: Record<string, any>;
}

interface AuditCategory {
  status: 'healthy' | 'warning' | 'critical';
  score?: number;
  issues: AuditIssue[];
}

interface AuditReport {
  timestamp: string;
  overall_status: 'healthy' | 'warning' | 'critical';
  summary: {
    total_issues: number;
    critical: number;
    warning: number;
    info: number;
  };
  categories: {
    security: AuditCategory;
    system_health: AuditCategory;
    data_integrity: AuditCategory;
    users: AuditCategory;
    financial: AuditCategory;
    integrations: AuditCategory;
  };
  recommendations: string[];
  execution_time_ms: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('Unauthorized');
    }

    console.log('🔍 Starting system audit...');

    // Execute todas as auditorias em paralelo
    const [
      securityResult,
      systemHealthResult,
      dataIntegrityResult,
      usersResult,
      financialResult,
      integrationsResult
    ] = await Promise.all([
      auditSecurity(supabase),
      auditSystemHealth(supabase),
      auditDataIntegrity(supabase),
      auditUsers(supabase),
      auditFinancial(supabase),
      auditIntegrations(supabase)
    ]);

    // Calcular totais
    const allIssues = [
      ...securityResult.issues,
      ...systemHealthResult.issues,
      ...dataIntegrityResult.issues,
      ...usersResult.issues,
      ...financialResult.issues,
      ...integrationsResult.issues
    ];

    const summary = {
      total_issues: allIssues.length,
      critical: allIssues.filter(i => i.severity === 'critical').length,
      warning: allIssues.filter(i => i.severity === 'warning').length,
      info: allIssues.filter(i => i.severity === 'info').length
    };

    // Determinar status geral
    const overall_status = summary.critical > 0 ? 'critical' : 
                          summary.warning > 0 ? 'warning' : 'healthy';

    // Gerar recomendações
    const recommendations = generateRecommendations(allIssues);

    const execution_time_ms = Date.now() - startTime;

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      overall_status,
      summary,
      categories: {
        security: securityResult,
        system_health: systemHealthResult,
        data_integrity: dataIntegrityResult,
        users: usersResult,
        financial: financialResult,
        integrations: integrationsResult
      },
      recommendations,
      execution_time_ms
    };

    // Salvar relatório no banco
    await supabase.from('system_audit_reports').insert({
      executed_by: userId,
      overall_status,
      total_issues: summary.total_issues,
      critical_count: summary.critical,
      warning_count: summary.warning,
      info_count: summary.info,
      report_data: report,
      execution_time_ms
    });

    console.log(`✅ Audit completed: ${summary.total_issues} issues found (${summary.critical} critical, ${summary.warning} warning)`);

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Audit error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function auditSecurity(supabase: any): Promise<AuditCategory> {
  const issues: AuditIssue[] = [];

  // Checar dados públicos expostos - rank_rent_clients
  const { data: publicClients, count: clientsCount } = await supabase
    .from('rank_rent_clients')
    .select('*', { count: 'exact', head: true });
  
  if (clientsCount && clientsCount > 0) {
    issues.push({
      severity: 'critical',
      category: 'security',
      title: 'Dados de clientes expostos publicamente',
      description: `${clientsCount} registros de clientes acessíveis sem autenticação`,
      recommendation: 'Revisar e restringir políticas RLS da tabela rank_rent_clients'
    });
  }

  // Checar client_portal_analytics exposto
  const { count: portalCount } = await supabase
    .from('client_portal_analytics')
    .select('*', { count: 'exact', head: true });
  
  if (portalCount && portalCount > 0) {
    issues.push({
      severity: 'critical',
      category: 'security',
      title: 'Analytics de portal expostos publicamente',
      description: `${portalCount} registros de analytics acessíveis sem autenticação`,
      recommendation: 'Revisar políticas RLS da tabela client_portal_analytics'
    });
  }

  const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                 issues.some(i => i.severity === 'warning') ? 'warning' : 'healthy';

  return { status, issues };
}

async function auditSystemHealth(supabase: any): Promise<AuditCategory> {
  const issues: AuditIssue[] = [];

  // Checar GSC integrations unhealthy
  const { data: unhealthyGsc, count: unhealthyCount } = await supabase
    .from('google_search_console_integrations')
    .select('*', { count: 'exact' })
    .eq('health_status', 'unhealthy');

  if (unhealthyCount && unhealthyCount > 0) {
    issues.push({
      severity: 'warning',
      category: 'system_health',
      title: 'Integrações GSC não saudáveis',
      description: `${unhealthyCount} integrações GSC com status unhealthy`,
      recommendation: 'Verificar e reconfigurar integrações GSC problemáticas',
      metadata: { count: unhealthyCount }
    });
  }

  // Checar APIs de geolocalização com erros
  const { data: geoApis } = await supabase
    .from('geolocation_api_configs')
    .select('*')
    .gt('error_count', 50);

  if (geoApis && geoApis.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'system_health',
      title: 'APIs de geolocalização com alto índice de erros',
      description: `${geoApis.length} APIs com mais de 50 erros acumulados`,
      recommendation: 'Revisar e reativar APIs problemáticas'
    });
  }

  const score = 100 - (issues.length * 20);
  const status = score < 60 ? 'critical' : score < 80 ? 'warning' : 'healthy';

  return { status, score, issues };
}

async function auditDataIntegrity(supabase: any): Promise<AuditCategory> {
  const issues: AuditIssue[] = [];

  // Conversões órfãs (sem site)
  const { count: orphanConversions } = await supabase
    .from('rank_rent_conversions')
    .select('*', { count: 'exact', head: true })
    .is('site_id', null);

  if (orphanConversions && orphanConversions > 0) {
    issues.push({
      severity: 'warning',
      category: 'data_integrity',
      title: 'Conversões órfãs detectadas',
      description: `${orphanConversions} conversões sem site associado`,
      recommendation: 'Limpar registros órfãos ou associar a sites válidos'
    });
  }

  // Páginas órfãs
  const { count: orphanPages } = await supabase
    .from('rank_rent_pages')
    .select('*', { count: 'exact', head: true })
    .is('site_id', null);

  if (orphanPages && orphanPages > 0) {
    issues.push({
      severity: 'warning',
      category: 'data_integrity',
      title: 'Páginas órfãs detectadas',
      description: `${orphanPages} páginas sem site associado`,
      recommendation: 'Associar páginas a sites válidos ou remover registros'
    });
  }

  // Sites alugados sem valor
  const { data: rentedWithoutValue } = await supabase
    .from('rank_rent_sites')
    .select('id, site_name')
    .eq('is_rented', true)
    .or('monthly_rent_value.is.null,monthly_rent_value.eq.0');

  if (rentedWithoutValue && rentedWithoutValue.length > 0) {
    issues.push({
      severity: 'info',
      category: 'data_integrity',
      title: 'Sites alugados sem valor configurado',
      description: `${rentedWithoutValue.length} sites marcados como alugados mas sem valor mensal`,
      recommendation: 'Configurar valores de aluguel ou desmarcar como alugado'
    });
  }

  const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                 issues.some(i => i.severity === 'warning') ? 'warning' : 'healthy';

  return { status, issues };
}

async function auditUsers(supabase: any): Promise<AuditCategory> {
  const issues: AuditIssue[] = [];

  // Contas inativas há muito tempo
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { count: inactiveUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('last_activity_at', ninetyDaysAgo.toISOString());

  if (inactiveUsers && inactiveUsers > 0) {
    issues.push({
      severity: 'info',
      category: 'users',
      title: 'Usuários inativos há mais de 90 dias',
      description: `${inactiveUsers} contas sem atividade recente`,
      recommendation: 'Considerar desativar ou notificar usuários inativos'
    });
  }

  // Trials expirados
  const { count: expiredTrials } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'expired');

  if (expiredTrials && expiredTrials > 0) {
    issues.push({
      severity: 'warning',
      category: 'users',
      title: 'Trials expirados não convertidos',
      description: `${expiredTrials} usuários com trial expirado`,
      recommendation: 'Executar campanha de reativação ou conversão'
    });
  }

  // Usuários sem subscription ativa
  const { data: usersWithoutSub } = await supabase
    .from('profiles')
    .select(`
      id, 
      email,
      user_subscriptions!inner(status)
    `)
    .not('user_subscriptions', 'is', null)
    .neq('user_subscriptions.status', 'active');

  if (usersWithoutSub && usersWithoutSub.length > 0) {
    issues.push({
      severity: 'info',
      category: 'users',
      title: 'Usuários sem subscription ativa',
      description: `${usersWithoutSub.length} usuários cadastrados sem plano ativo`,
      recommendation: 'Oferecer planos ou remover contas inativas'
    });
  }

  const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                 issues.some(i => i.severity === 'warning') ? 'warning' : 'healthy';

  return { status, issues };
}

async function auditFinancial(supabase: any): Promise<AuditCategory> {
  const issues: AuditIssue[] = [];

  // Subscriptions com status problemático
  const { data: problematicSubs } = await supabase
    .from('user_subscriptions')
    .select('*')
    .in('status', ['past_due', 'canceled']);

  if (problematicSubs && problematicSubs.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'financial',
      title: 'Subscriptions com pagamento pendente ou canceladas',
      description: `${problematicSubs.length} assinaturas com problemas financeiros`,
      recommendation: 'Seguir com cobranças ou cancelar definitivamente',
      metadata: { count: problematicSubs.length }
    });
  }

  // Contratos expirados
  const today = new Date().toISOString().split('T')[0];
  const { count: expiredContracts } = await supabase
    .from('rank_rent_sites')
    .select('*', { count: 'exact', head: true })
    .eq('is_rented', true)
    .lt('contract_end_date', today);

  if (expiredContracts && expiredContracts > 0) {
    issues.push({
      severity: 'info',
      category: 'financial',
      title: 'Contratos de aluguel expirados',
      description: `${expiredContracts} sites com contrato vencido`,
      recommendation: 'Renovar contratos ou liberar sites'
    });
  }

  const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                 issues.some(i => i.severity === 'warning') ? 'warning' : 'healthy';

  return { status, issues };
}

async function auditIntegrations(supabase: any): Promise<AuditCategory> {
  const issues: AuditIssue[] = [];

  // GSC com múltiplas falhas consecutivas
  const { data: failingGsc } = await supabase
    .from('google_search_console_integrations')
    .select('*')
    .gt('consecutive_failures', 5);

  if (failingGsc && failingGsc.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'integrations',
      title: 'Integrações GSC falhando repetidamente',
      description: `${failingGsc.length} integrações com mais de 5 falhas consecutivas`,
      recommendation: 'Revalidar credenciais e permissões das integrações'
    });
  }

  // IndexNow keys não validadas
  const { count: unvalidatedKeys } = await supabase
    .from('rank_rent_sites')
    .select('*', { count: 'exact', head: true })
    .not('indexnow_key', 'is', null)
    .eq('indexnow_validated', false);

  if (unvalidatedKeys && unvalidatedKeys > 0) {
    issues.push({
      severity: 'info',
      category: 'integrations',
      title: 'Chaves IndexNow não validadas',
      description: `${unvalidatedKeys} sites com chave IndexNow não validada`,
      recommendation: 'Validar chaves IndexNow pendentes'
    });
  }

  const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                 issues.some(i => i.severity === 'warning') ? 'warning' : 'healthy';

  return { status, issues };
}

function generateRecommendations(issues: AuditIssue[]): string[] {
  const recommendations: string[] = [];
  const criticalCount = issues.filter(i => i.severity === 'critical').length;

  if (criticalCount > 0) {
    recommendations.push(`🔴 URGENTE: Resolver ${criticalCount} problema(s) crítico(s) imediatamente`);
  }

  const securityIssues = issues.filter(i => i.category === 'security');
  if (securityIssues.length > 0) {
    recommendations.push('🔒 Priorizar correções de segurança (RLS, dados expostos)');
  }

  const integrityIssues = issues.filter(i => i.category === 'data_integrity');
  if (integrityIssues.length > 0) {
    recommendations.push('🗄️ Executar limpeza de dados órfãos e inconsistências');
  }

  const financialIssues = issues.filter(i => i.category === 'financial');
  if (financialIssues.length > 0) {
    recommendations.push('💰 Revisar subscriptions problemáticas e contratos expirados');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema operando normalmente. Monitorar métricas de saúde.');
  }

  return recommendations;
}
