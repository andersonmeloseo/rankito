import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`[Mapbox Monthly Reset] Starting reset for ${monthYear}`);

    // Get all existing records
    const { data: existingRecords, error: fetchError } = await supabase
      .from('mapbox_usage_tracking')
      .select('user_id, month_year');

    if (fetchError) {
      console.error('[Mapbox Monthly Reset] Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`[Mapbox Monthly Reset] Found ${existingRecords?.length || 0} existing records`);

    // Get unique user IDs
    const uniqueUserIds = [...new Set(existingRecords?.map(r => r.user_id) || [])];
    
    let createdCount = 0;
    let updatedCount = 0;

    for (const userId of uniqueUserIds) {
      // Check if record exists for current month
      const existingForMonth = existingRecords?.find(
        r => r.user_id === userId && r.month_year === monthYear
      );

      if (existingForMonth) {
        // Reset existing record
        const { error: updateError } = await supabase
          .from('mapbox_usage_tracking')
          .update({
            map_loads_count: 0,
            limit_reached: false,
            last_reset_at: now.toISOString(),
          })
          .eq('user_id', userId)
          .eq('month_year', monthYear);

        if (updateError) {
          console.error(`[Mapbox Monthly Reset] Update error for user ${userId}:`, updateError);
        } else {
          updatedCount++;
          console.log(`[Mapbox Monthly Reset] Reset record for user ${userId}`);
        }
      } else {
        // Create new record for current month
        const { error: insertError } = await supabase
          .from('mapbox_usage_tracking')
          .insert({
            user_id: userId,
            month_year: monthYear,
            map_loads_count: 0,
            limit_reached: false,
            last_reset_at: now.toISOString(),
          });

        if (insertError) {
          console.error(`[Mapbox Monthly Reset] Insert error for user ${userId}:`, insertError);
        } else {
          createdCount++;
          console.log(`[Mapbox Monthly Reset] Created new record for user ${userId}`);
        }
      }
    }

    console.log(`[Mapbox Monthly Reset] Completed - Created: ${createdCount}, Updated: ${updatedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        monthYear,
        created: createdCount,
        updated: updatedCount,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Mapbox Monthly Reset] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
