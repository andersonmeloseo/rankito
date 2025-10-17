import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      site_name, 
      page_url, 
      event_type, 
      cta_text,
      metadata 
    } = await req.json();

    console.log('Tracking event:', { site_name, page_url, event_type });

    // Validate required fields
    if (!site_name || !page_url || !event_type) {
      console.error('Missing required fields:', { site_name, page_url, event_type });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_name, page_url, event_type' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find site by site_name
    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('id')
      .eq('site_name', site_name)
      .single();

    if (siteError || !site) {
      console.error('Site not found:', site_name, siteError);
      return new Response(
        JSON.stringify({ error: 'Site not registered in system' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract page_path from URL
    const url = new URL(page_url);
    const page_path = url.pathname;

    // Extract IP and User-Agent from headers
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';
    const referrer = metadata?.referrer || null;

    // Insert conversion
    const { error: insertError } = await supabase
      .from('rank_rent_conversions')
      .insert({
        site_id: site.id,
        page_url,
        page_path,
        event_type,
        cta_text,
        metadata: metadata || {},
        ip_address,
        user_agent,
        referrer,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save conversion', details: insertError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Conversion saved successfully for site:', site_name);

    return new Response(
      JSON.stringify({ success: true, message: 'Conversion tracked successfully' }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
