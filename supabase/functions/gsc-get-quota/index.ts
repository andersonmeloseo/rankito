import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    console.log('🚀 GSC Get Quota - Request received');

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

    // Parse request
    const url = new URL(req.url);
    const integration_id = url.searchParams.get('integration_id');

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: integration_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Checking quota for integration:', integration_id);

    // Calcular início do dia atual (UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Contar requests de hoje
    const { count, error: countError } = await supabase
      .from('gsc_url_indexing_requests')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', integration_id)
      .gte('submitted_at', today.toISOString());

    if (countError) {
      console.error('❌ Error checking quota:', countError);
      throw new Error('Failed to check daily quota');
    }

    const usedQuota = count || 0;
    const remainingQuota = DAILY_QUOTA_LIMIT - usedQuota;

    console.log('📊 Quota status:', {
      used: usedQuota,
      limit: DAILY_QUOTA_LIMIT,
      remaining: remainingQuota,
      date: today.toISOString(),
    });

    // Buscar histórico recente (últimos 10 requests)
    const { data: recentRequests, error: historyError } = await supabase
      .from('gsc_url_indexing_requests')
      .select('*')
      .eq('integration_id', integration_id)
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('❌ Error fetching history:', historyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        quota: {
          used: usedQuota,
          limit: DAILY_QUOTA_LIMIT,
          remaining: remainingQuota,
          percentage: Math.round((usedQuota / DAILY_QUOTA_LIMIT) * 100),
        },
        recent_requests: recentRequests || [],
        reset_at: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-get-quota:', error);
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
