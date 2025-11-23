import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken, markIntegrationHealthy, markIntegrationUnhealthy } from '../_shared/gbp-oauth-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 Starting GBP Analytics Sync...');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: profiles } = await supabase.from('google_business_profiles').select('*').eq('is_active', true);
    if (!profiles?.length) {
      return new Response(JSON.stringify({ message: 'No active profiles' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let totalSynced = 0;
    for (const profile of profiles) {
      try {
        const integration = await getIntegrationWithValidToken(profile.id);
        const accessToken = integration.access_token;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const insightsUrl = `https://businessprofileperformance.googleapis.com/v1/${integration.location_name}/searchkeywords/impressions/monthly`;
        const params = new URLSearchParams({
          'monthlyRange.startMonth.year': startDate.getFullYear().toString(),
          'monthlyRange.startMonth.month': (startDate.getMonth() + 1).toString(),
          'monthlyRange.endMonth.year': endDate.getFullYear().toString(),
          'monthlyRange.endMonth.month': (endDate.getMonth() + 1).toString(),
        });

        const response = await fetch(`${insightsUrl}?${params}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const metrics: any[] = [];
        
        for (const kw of data.searchKeywordsCounts || []) {
          for (const val of kw.insightsValue?.value || []) {
            const date = `${val.timeDimension?.timeRange?.startTime?.year}-${String(val.timeDimension?.timeRange?.startTime?.month || 1).padStart(2, '0')}-01`;
            metrics.push({ metric_date: date, profile_id: profile.id, site_id: profile.site_id, searches_direct: val.value || 0 });
          }
        }

        if (metrics.length) {
          await supabase.from('gbp_analytics').upsert(metrics, { onConflict: 'profile_id,metric_date' });
          totalSynced += metrics.length;
        }

        await markIntegrationHealthy(profile.id);
      } catch (err) {
        await markIntegrationUnhealthy(profile.id, err instanceof Error ? err.message : 'Unknown error');
      }
    }

    return new Response(JSON.stringify({ success: true, total_synced: totalSynced }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
