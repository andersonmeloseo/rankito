import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_QUOTA_LIMIT = 200;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const correlationId = req.headers.get('x-correlation-id') || 
                          `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    
    console.log(`[${correlationId}] 🚀 GSC Get Aggregated Quota - Request received`);

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
    const { site_id } = await req.json();

    if (!site_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: site_id' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'x-correlation-id': correlationId 
          } 
        }
      );
    }

    console.log(`[${correlationId}] 📋 Fetching aggregated quota for site:`, site_id);

    // Buscar todas integrações ativas do site
    const { data: integrations, error: integrationsError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('site_id', site_id)
      .eq('is_active', true);

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    const totalIntegrations = integrations?.length || 0;
    const totalLimit = totalIntegrations * DAILY_QUOTA_LIMIT;

    // Buscar uso de hoje para cada integração
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const breakdown = await Promise.all(
      (integrations || []).map(async (integration) => {
        const { count, error } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('integration_id', integration.id)
          .gte('created_at', today.toISOString());

        if (error) {
          console.error('Error fetching usage for integration:', integration.id, error);
        }

        const used = count || 0;
        const remaining = DAILY_QUOTA_LIMIT - used;

        // Marcar como unhealthy se quota esgotada
        let actualHealthStatus = integration.health_status || 'healthy';
        
        // Quota completamente esgotada
        if (used >= DAILY_QUOTA_LIMIT) {
          actualHealthStatus = 'unhealthy';
          
          // Atualizar no banco apenas se mudou
          if (integration.health_status !== 'unhealthy') {
            const cooldownEnd = new Date(Date.now() + 60 * 60 * 1000);
            
            await supabase
              .from('google_search_console_integrations')
              .update({ 
                health_status: 'unhealthy',
                last_error: `Quota diária esgotada: ${used}/${DAILY_QUOTA_LIMIT}`,
                health_check_at: cooldownEnd.toISOString(),
                consecutive_failures: (integration.consecutive_failures || 0) + 1,
              })
              .eq('id', integration.id)
              .eq('health_status', integration.health_status); // Previne race condition
            
            console.log(`[${correlationId}] ⚠️ Integration ${integration.connection_name} marked unhealthy: ${used}/${DAILY_QUOTA_LIMIT}`);
          }
        }
        // Aviso quando perto do limite (95%)
        else if (used >= DAILY_QUOTA_LIMIT * 0.95) {
          console.log(`[${correlationId}] ⚠️ Integration ${integration.connection_name} near limit: ${used}/${DAILY_QUOTA_LIMIT}`);
        }

        return {
          integration_id: integration.id,
          name: integration.connection_name,
          email: integration.google_email,
          used,
          limit: DAILY_QUOTA_LIMIT,
          remaining,
          health_status: actualHealthStatus,
          last_error: integration.last_error,
          health_check_at: integration.health_check_at,
        };
      })
    );

    const totalUsed = breakdown.reduce((sum, item) => sum + item.used, 0);
    const totalRemaining = totalLimit - totalUsed;
    const percentage = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
    const unhealthyCount = breakdown.filter(item => item.health_status === 'unhealthy').length;

    const aggregatedQuota = {
      total_integrations: totalIntegrations,
      total_limit: totalLimit,
      total_used: totalUsed,
      total_remaining: totalRemaining,
      percentage,
      breakdown,
      unhealthy_count: unhealthyCount,
    };

    console.log('✅ Aggregated quota calculated:', aggregatedQuota);

    return new Response(
      JSON.stringify({ aggregated_quota: aggregatedQuota }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-get-aggregated-quota:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
