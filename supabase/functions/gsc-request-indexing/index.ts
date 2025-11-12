import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-helpers.ts';

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
    console.log('🚀 GSC Request Indexing - Request received');

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { site_id, url, page_id, request_type = 'URL_UPDATED' } = await req.json();

    if (!site_id || !url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Params:', { site_id, url, request_type });

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

    // Verificar quota de cada integração e escolher a com mais quota disponível
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const integrationsWithQuota = await Promise.all(
      integrations.map(async (integration) => {
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

    // Filtrar integrações com quota disponível e escolher a com mais quota
    const availableIntegrations = integrationsWithQuota.filter(int => int.remaining_quota > 0);

    if (availableIntegrations.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Daily quota exceeded',
          message: `Limite diário de ${DAILY_QUOTA_LIMIT} URLs atingido em todas as integrações. Tente novamente amanhã.`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ordenar por quota restante (maior primeiro) e escolher a primeira
    availableIntegrations.sort((a, b) => b.remaining_quota - a.remaining_quota);
    const selectedIntegration = availableIntegrations[0];
    const integration_id = selectedIntegration.id;

    console.log(`✅ Selected integration ${selectedIntegration.connection_name} with ${selectedIntegration.remaining_quota} remaining quota`);

    // Buscar integração com token válido
    const integration = await getIntegrationWithValidToken(integration_id);

    console.log('🔐 Integration found:', integration.connection_name);

    // Buscar site_id da integração para atualizar páginas depois
    const integrationSiteId = selectedIntegration.site_id;

    const usedQuota = selectedIntegration.used_quota;
    const remainingQuota = selectedIntegration.remaining_quota;

    console.log('📊 Quota status:', {
      integration: selectedIntegration.connection_name,
      used: usedQuota,
      limit: DAILY_QUOTA_LIMIT,
      remaining: remainingQuota,
    });

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

    if (recentError) {
      console.error('❌ Error checking recent requests:', recentError);
    }

    if (recentRequest) {
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
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          type: request_type, // URL_UPDATED ou URL_DELETED
        }),
      }
    );

    const indexingData = await indexingResponse.json();

    if (!indexingResponse.ok) {
      console.error('❌ GSC Indexing API Error:', indexingData);
      
      // Salvar request com erro
      await supabase
        .from('gsc_url_indexing_requests')
        .insert({
          integration_id,
          page_id: page_id || null,
          url,
          request_type,
          status: 'error',
          error_message: indexingData.error?.message || 'Unknown error',
          gsc_response: indexingData,
          submitted_at: new Date().toISOString(),
        });

      throw new Error(`Failed to request indexing: ${indexingData.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Indexing requested successfully');
    console.log('📊 GSC Response:', indexingData);

    // Salvar request no banco
    const { data: savedRequest, error: dbError } = await supabase
      .from('gsc_url_indexing_requests')
      .insert({
        integration_id,
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
          gsc_integration_used: selectedIntegration.connection_name,
          gsc_last_checked_at: new Date().toISOString(),
        })
        .eq('id', page_id);
    }

    console.log('✅ Request saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        request: savedRequest,
        gsc_response: indexingData,
        quota: {
          used: usedQuota + 1,
          limit: DAILY_QUOTA_LIMIT,
          remaining: remainingQuota - 1,
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
