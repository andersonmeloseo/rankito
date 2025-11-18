import { createClient } from 'npm:@supabase/supabase-js@2';

const DAILY_QUOTA_LIMIT = 200;

Deno.serve(async (req) => {
  try {
    const correlationId = `health-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    console.log(`[${correlationId}] 🏥 GSC Health Check - Starting at`, new Date().toISOString());

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active integrations
    const { data: integrations, error: intError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('is_active', true);

    if (intError) {
      console.error(`[${correlationId}] ❌ Failed to fetch integrations:`, intError);
      throw intError;
    }

    console.log(`[${correlationId}] 🔍 Found ${integrations?.length || 0} active integrations`);

    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let healthyCount = 0;
    let unhealthyCount = 0;
    let resetCount = 0;

    for (const integration of integrations || []) {
      // Check if cooldown expired
      if (integration.health_status === 'unhealthy' && integration.health_check_at) {
        const cooldownEnd = new Date(integration.health_check_at).getTime();
        
        if (now > cooldownEnd) {
          // Reset to healthy
          const { error: updateError } = await supabase
            .from('google_search_console_integrations')
            .update({
              health_status: 'healthy',
              last_error: null,
              health_check_at: null,
              consecutive_failures: 0,
            })
            .eq('id', integration.id);

          if (!updateError) {
            console.log(
              `[${correlationId}] ✅ Reset integration ${integration.connection_name} to healthy`
            );
            resetCount++;
            healthyCount++;
          }
        } else {
          unhealthyCount++;
        }
      } else if (integration.health_status === 'healthy' || !integration.health_status) {
        // Check quota usage
        const { count } = await supabase
          .from('gsc_url_indexing_requests')
          .select('*', { count: 'exact', head: true })
          .eq('integration_id', integration.id)
          .gte('submitted_at', today.toISOString());

        const used = count || 0;
        
        // Mark unhealthy if quota exceeded
        if (used >= DAILY_QUOTA_LIMIT) {
          const cooldownEnd = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
          
          const { error: updateError } = await supabase
            .from('google_search_console_integrations')
            .update({
              health_status: 'unhealthy',
              last_error: `Quota excedida: ${used}/${DAILY_QUOTA_LIMIT}`,
              health_check_at: cooldownEnd.toISOString(),
              consecutive_failures: (integration.consecutive_failures || 0) + 1,
            })
            .eq('id', integration.id);

          if (!updateError) {
            console.log(
              `[${correlationId}] ⚠️ Marked integration ${integration.connection_name} as unhealthy (quota exceeded)`
            );
            unhealthyCount++;
          }
        } else {
          healthyCount++;
        }
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      total_integrations: integrations?.length || 0,
      healthy: healthyCount,
      unhealthy: unhealthyCount,
      reset: resetCount,
    };

    console.log(`[${correlationId}] 📊 Health check complete:`, summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        correlationId,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
      }
    );
  } catch (error) {
    console.error('❌ Health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
