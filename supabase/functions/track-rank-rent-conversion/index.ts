import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://advogadospelobrasil.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
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

    // Extract token from URL
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      console.error('Missing tracking token');
      return new Response(
        JSON.stringify({ error: 'Missing tracking token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      site_name, 
      page_url, 
      event_type, 
      cta_text,
      metadata 
    } = await req.json();

    console.log('Tracking event:', { token, site_name, page_url, event_type });

    // Validate required fields
    if (!page_url || !event_type) {
      console.error('Missing required fields:', { page_url, event_type });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: page_url, event_type' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle connection test
    if (event_type === 'test') {
      // Validate token exists
      const { data: site, error: siteError } = await supabase
        .from('rank_rent_sites')
        .select('id, site_name')
        .eq('tracking_token', token)
        .single();

      if (siteError || !site) {
        console.error('Invalid tracking token:', token);
        return new Response(
          JSON.stringify({ error: 'Invalid tracking token' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update plugin installation status
      const { error: updateError } = await supabase
        .from('rank_rent_sites')
        .update({ tracking_pixel_installed: true })
        .eq('id', site.id);

      if (updateError) {
        console.error('Error updating plugin status:', updateError);
      }

      console.log('Connection test successful for site:', site.site_name);
      return new Response(
        JSON.stringify({ success: true, message: 'Connection test successful', site_name: site.site_name }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find site by tracking token (more secure than site_name)
    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('id, site_name')
      .eq('tracking_token', token)
      .single();

    if (siteError || !site) {
      console.error('Invalid tracking token:', token);
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract page_path from URL
    const pageUrl = new URL(page_url);
    const page_path = pageUrl.pathname;

    // Extract IP and User-Agent from headers
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';
    const referrer = metadata?.referrer || null;

    // Detect device type from user agent
    const detectDevice = (userAgent: string): string => {
      const ua = userAgent.toLowerCase();
      
      // Mobile detection
      if (ua.includes('mobile') || 
          ua.includes('android') || 
          ua.includes('iphone') || 
          ua.includes('ipod') || 
          ua.includes('blackberry') || 
          ua.includes('windows phone')) {
        return 'mobile';
      }
      
      // Tablet detection
      if (ua.includes('tablet') || 
          ua.includes('ipad') || 
          ua.includes('kindle') || 
          ua.includes('playbook') || 
          ua.includes('silk')) {
        return 'tablet';
      }
      
      return 'desktop';
    };

    const device = detectDevice(user_agent);

    // Find or create page
    let pageId = null;
    const { data: existingPage } = await supabase
      .from('rank_rent_pages')
      .select('id')
      .eq('page_url', page_url)
      .maybeSingle();

    if (existingPage) {
      pageId = existingPage.id;
    } else {
      // Create page automatically
      const { data: newPage, error: pageError } = await supabase
        .from('rank_rent_pages')
        .insert({
          site_id: site.id,
          page_url,
          page_path,
          page_title: metadata?.page_title || null,
          phone_number: metadata?.detected_phone || null,
          status: 'active'
        })
        .select('id')
        .single();

      if (pageError) {
        console.error('Error creating page:', pageError);
      } else if (newPage) {
        pageId = newPage.id;
      }
    }

    // Insert conversion
    const { error: insertError } = await supabase
      .from('rank_rent_conversions')
      .insert({
        site_id: site.id,
        page_id: pageId,
        page_url,
        page_path,
        event_type,
        cta_text,
        metadata: { 
          ...metadata, 
          device,
          detected_at: new Date().toISOString()
        },
        ip_address,
        user_agent,
        referrer,
      });

    if (insertError) {
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        data: { site_id: site.id, page_id: pageId, event_type }
      });
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
