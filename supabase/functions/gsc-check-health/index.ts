import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verifica se há 3+ falhas consecutivas
 */
function checkRepeatedFailures(integration: any, jobs: any[]): any | null {
  if (jobs.length < 3) return null;

  const lastThree = jobs.slice(0, 3);
  const allFailed = lastThree.every((j) => j.status === 'failed');

  if (allFailed) {
    return {
      alert_type: 'repeated_failure',
      severity: 'critical',
      title: '3 Falhas Consecutivas Detectadas',
      message: `A integração "${integration.connection_name}" falhou 3 vezes seguidas`,
      suggestion: 'Verifique as credenciais do GSC e os logs de erro detalhados',
    };
  }

  return null;
}

/**
 * Verifica se integração nunca foi executada
 */
function checkNeverExecuted(integration: any, jobs: any[]): any | null {
  const ageHours = (Date.now() - new Date(integration.created_at).getTime()) / (1000 * 60 * 60);

  if (jobs.length === 0 && ageHours > 24) {
    return {
      alert_type: 'never_executed',
      severity: 'warning',
      title: 'Integração Nunca Executada',
      message: `A integração "${integration.connection_name}" foi criada há ${Math.floor(ageHours)}h mas nunca rodou`,
      suggestion: 'Execute uma indexação manual para validar a configuração',
    };
  }

  return null;
}

/**
 * Verifica se arquivo IndexNow está ausente
 */
function checkIndexNowMissing(jobs: any[]): any | null {
  if (jobs.length === 0) return null;

  const lastJob = jobs[0];
  if (lastJob.error_type === 'indexnow_file_not_found') {
    return {
      alert_type: 'indexnow_missing',
      severity: 'critical',
      title: 'Arquivo IndexNow Não Encontrado',
      message: 'O último job falhou porque o arquivo IndexNow (.txt) não está acessível',
      suggestion: 'Gere e publique o arquivo IndexNow na raiz do seu site',
    };
  }

  return null;
}

/**
 * Verifica taxa de sucesso baixa
 */
function checkLowSuccessRate(jobs: any[]): any | null {
  if (jobs.length < 5) return null;

  const lastFive = jobs.slice(0, 5);
  const successCount = lastFive.filter((j) => j.status === 'completed').length;
  const successRate = successCount / lastFive.length;

  if (successRate < 0.5) {
    return {
      alert_type: 'low_success_rate',
      severity: 'warning',
      title: 'Taxa de Sucesso Baixa',
      message: `Apenas ${Math.round(successRate * 100)}% dos últimos 5 jobs foram bem-sucedidos`,
      suggestion: 'Revise configurações e verifique quota diária do GSC',
    };
  }

  return null;
}

/**
 * Verifica problemas de configuração
 */
function checkConfigIssue(jobs: any[]): any | null {
  if (jobs.length === 0) return null;

  const lastJob = jobs[0];
  if (lastJob.error_type === 'gsc_auth_failed') {
    return {
      alert_type: 'config_issue',
      severity: 'critical',
      title: 'Erro de Autenticação GSC',
      message: 'A autenticação com Google Search Console falhou',
      suggestion: 'Verifique as credenciais da Service Account no Google Cloud',
    };
  }

  return null;
}

/**
 * Cria ou atualiza alerta
 */
async function createOrUpdateAlert(supabase: any, alertData: any): Promise<void> {
  const { data: existing } = await supabase
    .from('gsc_indexing_alerts')
    .select('*')
    .eq('site_id', alertData.site_id)
    .eq('integration_id', alertData.integration_id)
    .eq('alert_type', alertData.alert_type)
    .eq('acknowledged', false)
    .maybeSingle();

  if (existing) {
    // Atualizar alerta existente
    await supabase
      .from('gsc_indexing_alerts')
      .update({
        message: alertData.message,
        suggestion: alertData.suggestion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    console.log(`🔄 Updated alert: ${alertData.title}`);
  } else {
    // Criar novo alerta
    await supabase.from('gsc_indexing_alerts').insert(alertData);
    console.log(`🚨 Created alert: ${alertData.title}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏥 GSC Health Check - Starting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as integrações ativas
    const { data: integrations, error: integrationsError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('is_active', true);

    if (integrationsError) {
      throw integrationsError;
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ No active integrations found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active integrations',
          alerts_created: 0,
          alerts_updated: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Checking health of ${integrations.length} integrations`);

    let alertsCreated = 0;
    let alertsUpdated = 0;

    // Verificar cada integração
    for (const integration of integrations) {
      console.log(`🔍 Checking integration: ${integration.connection_name}`);

      // Buscar últimos 5 jobs
      const { data: jobs } = await supabase
        .from('gsc_indexing_jobs')
        .select('*')
        .eq('integration_id', integration.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const jobsArray = jobs || [];

      // Verificar cada condição
      const checks = [
        checkRepeatedFailures(integration, jobsArray),
        checkNeverExecuted(integration, jobsArray),
        checkIndexNowMissing(jobsArray),
        checkLowSuccessRate(jobsArray),
        checkConfigIssue(jobsArray),
      ];

      // Criar alertas para condições detectadas
      for (const alertData of checks) {
        if (alertData) {
          await createOrUpdateAlert(supabase, {
            ...alertData,
            site_id: integration.site_id,
            integration_id: integration.id,
          });

          if (alertData.severity === 'critical') {
            alertsCreated++;
          } else {
            alertsUpdated++;
          }
        }
      }
    }

    console.log(`✅ Health check completed`);

    return new Response(
      JSON.stringify({
        success: true,
        integrations_checked: integrations.length,
        alerts_created: alertsCreated,
        alerts_updated: alertsUpdated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
