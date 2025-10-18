import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting plugin status check...');

    // Find sites that are marked as not installed
    const { data: sitesNotInstalled, error: sitesError } = await supabase
      .from('rank_rent_sites')
      .select('id, site_name, tracking_token')
      .eq('tracking_pixel_installed', false);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sites' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sitesNotInstalled || sitesNotInstalled.length === 0) {
      console.log('No sites to check');
      return new Response(
        JSON.stringify({ message: 'No sites to check', updated: 0 }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking ${sitesNotInstalled.length} sites...`);

    // Check for recent conversions (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const sitesToUpdate: string[] = [];

    for (const site of sitesNotInstalled) {
      const { data: recentConversions, error: convError } = await supabase
        .from('rank_rent_conversions')
        .select('id')
        .eq('site_id', site.id)
        .gte('created_at', tenMinutesAgo)
        .limit(1);

      if (convError) {
        console.error(`Error checking conversions for site ${site.site_name}:`, convError);
        continue;
      }

      if (recentConversions && recentConversions.length > 0) {
        sitesToUpdate.push(site.id);
        console.log(`Found activity for site: ${site.site_name}`);
      }
    }

    // Update sites with recent activity
    if (sitesToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('rank_rent_sites')
        .update({ tracking_pixel_installed: true })
        .in('id', sitesToUpdate);

      if (updateError) {
        console.error('Error updating sites:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update sites' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Updated ${sitesToUpdate.length} sites to connected status`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: sitesNotInstalled.length,
        updated: sitesToUpdate.length,
        message: `Checked ${sitesNotInstalled.length} sites, updated ${sitesToUpdate.length}` 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
