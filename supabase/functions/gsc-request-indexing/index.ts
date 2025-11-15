import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  getIntegrationWithValidToken, 
  markIntegrationUnhealthy,
  markIntegrationHealthy,
  isAuthError 
} from '../_shared/gsc-helpers.ts';
import { selectBestIntegration, logIntegrationUsage } from '../_shared/gsc-rotation-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_QUOTA_LIMIT = 200;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    console.log('🚀 GSC Request Indexing - Request received at', new Date().toISOString());

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('❌ Invalid authentication:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const { site_id, url, page_id, request_type = 'URL_UPDATED' } = await req.json();

    if (!site_id || !url) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Request params:', { 
      site_id, 
      url, 
      page_id: page_id || 'none',
      request_type,
      user_id: user.id,
    });

    // Buscar todas integrações ativas do site
    const { data: integrations, error: integrationsError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('site_id', site_id)
      .eq('is_active', true);

    if (integrationsError || !integrations || integrations.length === 0) {
      throw new Error('Nenhuma integração ativa encontrada para este site');
    }

    console.log(`🔍 Found ${integrations.length} active integrations`);

    // Filtrar integrações healthy ou que já passaram do cooldown
    const now = Date.now();
    const availableIntegrations = integrations.filter(int => {
      if (int.health_status === 'healthy') return true;
      if (int.health_status === 'unhealthy' && int.health_check_at) {
        const cooldownEnd = new Date(int.health_check_at).getTime();
        return now > cooldownEnd; // Retry após cooldown
      }
      return true; // Se não tem status definido, assume healthy
    });

    if (availableIntegrations.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'All integrations unavailable',
          message: 'Todas as integrações GSC estão temporariamente indisponíveis. Tente novamente em alguns minutos.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${availableIntegrations.length} healthy integrations available`);

    // Verificar quota de cada integração disponível
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const integrationsWithQuota = await Promise.all(
      availableIntegrations.map(async (integration) => {
        const { count, error: countError } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('integration_id', integration.id)
          .gte('submitted_at', today.toISOString());

        if (countError) {
          console.error('❌ Error checking quota:', countError);
        }

        const usedQuota = count || 0;
        const remainingQuota = DAILY_QUOTA_LIMIT - usedQuota;

        return {
          ...integration,
          used_quota: usedQuota,
          remaining_quota: remainingQuota,
        };
      })
    );

    // Ordenar por quota restante (maior primeiro)
    integrationsWithQuota.sort((a, b) => b.remaining_quota - a.remaining_quota);

    // Validar se ALGUMA integração tem quota disponível
    const hasAvailableQuota = integrationsWithQuota.some(int => int.remaining_quota > 0);
    
    if (!hasAvailableQuota) {
      console.error('❌ All integrations quota exhausted');
      return new Response(
        JSON.stringify({
          error: 'Quota exhausted',
          message: 'Todas as integrações GSC atingiram o limite diário de 200 requisições. Tente novamente amanhã ou adicione mais integrações.',
          quotaStatus: integrationsWithQuota.map(int => ({
            name: int.connection_name,
            used: int.used_quota,
            limit: DAILY_QUOTA_LIMIT,
          })),
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tentar cada integração sequencialmente até uma funcionar
    let lastError: any = null;
    let successfulRequest = null;
    let selectedIntegration = null;

    for (const integration of integrationsWithQuota) {
      // Pular se não tem quota
      if (integration.remaining_quota <= 0) {
        console.log(`⚠️ Integration ${integration.connection_name} has no remaining quota`);
        continue;
      }

      try {
        console.log(`🔄 Trying integration: ${integration.connection_name}`);
        
        // Buscar integração com token válido
        const integrationData = await getIntegrationWithValidToken(integration.id);

        // Verificar se URL já foi indexada nas últimas 24h (em qualquer integração do site)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const { data: recentRequest, error: recentError } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*, google_search_console_integrations!inner(site_id)')
          .eq('google_search_console_integrations.site_id', site_id)
          .eq('url', url)
          .gte('submitted_at', twentyFourHoursAgo.toISOString())
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!recentError && recentRequest) {
          console.log('⚠️ URL já foi indexada nas últimas 24h');
          return new Response(
            JSON.stringify({
              error: 'URL recently indexed',
              message: 'Esta URL já foi indexada nas últimas 24 horas. Aguarde antes de solicitar novamente.',
              recent_request: recentRequest,
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Requisitar indexação via GSC Indexing API
        console.log('📤 Requesting indexing via GSC API...');
        
        const indexingResponse = await fetch(
          'https://indexing.googleapis.com/v3/urlNotifications:publish',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integrationData.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url,
              type: request_type,
            }),
          }
        );

        const indexingData = await indexingResponse.json();

        if (!indexingResponse.ok) {
          console.error('❌ GSC Indexing API Error:', indexingData);
          
          // Se erro de autenticação, marcar como unhealthy e tentar próxima
          if (isAuthError(indexingData)) {
            await markIntegrationUnhealthy(
              integration.id,
              indexingData.error?.message || 'Authentication error'
            );
            lastError = indexingData;
            continue; // Tentar próxima integração
          }
          
          throw new Error(`Failed to request indexing: ${indexingData.error?.message || 'Unknown error'}`);
        }

        console.log('✅ Indexing requested successfully with', integration.connection_name);
        
        // Marcar integração como healthy (se estava unhealthy)
        if (integration.health_status === 'unhealthy') {
          await markIntegrationHealthy(integration.id);
        }

        // Salvar request no banco
        const { data: savedRequest, error: dbError } = await supabase
          .from('gsc_url_indexing_requests')
          .insert({
            integration_id: integration.id,
            page_id: page_id || null,
            url,
            request_type,
            status: 'success',
            gsc_notification_id: indexingData.urlNotificationMetadata?.url || null,
            gsc_response: indexingData,
            submitted_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Database error:', dbError);
          throw new Error('Failed to save indexing request');
        }

        // Atualizar status GSC na página se page_id foi fornecido
        if (page_id) {
          await supabase
            .from('rank_rent_pages')
            .update({
              gsc_indexation_status: 'submitted',
              gsc_integration_used: integration.connection_name,
              gsc_last_checked_at: new Date().toISOString(),
            })
            .eq('id', page_id);
        }

        successfulRequest = savedRequest;
        selectedIntegration = integration;
        break; // Sucesso! Sair do loop

      } catch (error) {
        console.error(`❌ Integration ${integration.connection_name} failed:`, error);
        
        // Se erro de autenticação, marcar como unhealthy
        if (isAuthError(error)) {
          await markIntegrationUnhealthy(
            integration.id,
            error instanceof Error ? error.message : 'Authentication error'
          );
        }
        
        lastError = error;
        continue; // Tentar próxima integração
      }
    }

    // Se chegou aqui e não teve sucesso, todas falharam
    if (!successfulRequest || !selectedIntegration) {
      throw new Error(
        lastError instanceof Error 
          ? lastError.message 
          : 'All integrations failed. Please check integration health.'
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Request completed successfully in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        request: successfulRequest,
        integration_used: selectedIntegration.connection_name,
        quota: {
          used: selectedIntegration.used_quota + 1,
          limit: DAILY_QUOTA_LIMIT,
          remaining: selectedIntegration.remaining_quota - 1,
        },
        performance: {
          duration_ms: duration,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-request-indexing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});