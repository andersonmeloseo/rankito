import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAPBOX_MONTHLY_LIMIT = 50000;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[Mapbox Track Usage] User: ${userId}, Month: ${monthYear}`);

    // Get or create current month tracking record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('mapbox_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Mapbox Track Usage] Fetch error:', fetchError);
      throw fetchError;
    }

    let currentCount = 0;
    let limitReached = false;

    if (existingRecord) {
      // Check if already at limit
      if (existingRecord.limit_reached || existingRecord.map_loads_count >= MAPBOX_MONTHLY_LIMIT) {
        console.log(`[Mapbox Track Usage] Limit already reached: ${existingRecord.map_loads_count}`);
        return new Response(
          JSON.stringify({
            canLoad: false,
            currentCount: existingRecord.map_loads_count,
            limit: MAPBOX_MONTHLY_LIMIT,
            limitReached: true,
            resetDate: getNextResetDate()
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment counter
      currentCount = existingRecord.map_loads_count + 1;
      limitReached = currentCount >= MAPBOX_MONTHLY_LIMIT;

      const { error: updateError } = await supabase
        .from('mapbox_usage_tracking')
        .update({
          map_loads_count: currentCount,
          limit_reached: limitReached,
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('[Mapbox Track Usage] Update error:', updateError);
        throw updateError;
      }

      console.log(`[Mapbox Track Usage] Updated count: ${currentCount} / ${MAPBOX_MONTHLY_LIMIT}`);
    } else {
      // Create new record for this month
      currentCount = 1;
      limitReached = false;

      const { error: insertError } = await supabase
        .from('mapbox_usage_tracking')
        .insert({
          user_id: userId,
          month_year: monthYear,
          map_loads_count: currentCount,
          limit_reached: limitReached,
          last_reset_at: now.toISOString(),
        });

      if (insertError) {
        console.error('[Mapbox Track Usage] Insert error:', insertError);
        throw insertError;
      }

      console.log(`[Mapbox Track Usage] Created new record: ${currentCount} / ${MAPBOX_MONTHLY_LIMIT}`);
    }

    return new Response(
      JSON.stringify({
        canLoad: !limitReached,
        currentCount,
        limit: MAPBOX_MONTHLY_LIMIT,
        limitReached,
        resetDate: getNextResetDate()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Mapbox Track Usage] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}
