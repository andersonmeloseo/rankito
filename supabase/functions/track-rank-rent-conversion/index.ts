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

    // Extract token from URL
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    console.log('📊 Tracking request received:', {
      token,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    if (!token) {
      console.error('❌ Missing tracking token');
      return new Response(
        JSON.stringify({ error: 'Missing tracking token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
      console.log('✅ Body parsed successfully:', {
        hasPageUrl: !!body?.page_url,
        eventType: body?.event_type,
        siteName: body?.site_name
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: errorMessage }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { 
      site_name, 
      page_url, 
      event_type, 
      cta_text,
      metadata 
    } = body;

    // Validate required fields
    if (!page_url || !event_type) {
      console.error('❌ Missing required fields:', { 
        hasPageUrl: !!page_url, 
        hasEventType: !!event_type,
        receivedBody: body 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: page_url and event_type',
          received: { page_url: !!page_url, event_type: !!event_type }
        }), 
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
      console.error('❌ Site not found:', { 
        token, 
        error: siteError?.message,
        code: siteError?.code 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid tracking token',
          token,
          details: siteError?.message 
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Site found:', { siteId: site.id, siteName: site.site_name });

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

    // Get geolocation data
    const getGeolocation = async (ip: string, apiKey: string) => {
      try {
        // Ignorar IPs locais
        if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
          return { city: null, region: null, country: null, country_code: null };
        }

        // Extrair primeiro IP se houver múltiplos (x-forwarded-for pode ter lista)
        const cleanIp = ip.split(',')[0].trim();
        
        console.log('Fetching geolocation for IP:', cleanIp);
        
        const response = await fetch(
          `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${cleanIp}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }
        );

        if (!response.ok) {
          console.error('Geolocation API error:', response.status);
          return { city: null, region: null, country: null, country_code: null };
        }

        const data = await response.json();
        
        console.log('Geolocation result:', {
          city: data.city,
          region: data.state_prov,
          country: data.country_name,
          country_code: data.country_code2
        });
        
        return {
          city: data.city || null,
          region: data.state_prov || null,
          country: data.country_name || null,
          country_code: data.country_code2 || null
        };
      } catch (error) {
        console.error('Error fetching geolocation:', error);
        return { city: null, region: null, country: null, country_code: null };
      }
    };

    const geoApiKey = Deno.env.get('IPGEOLOCATION_API_KEY');
    const geoData = geoApiKey 
      ? await getGeolocation(ip_address, geoApiKey)
      : { city: null, region: null, country: null, country_code: null };

    console.log('IP Address:', ip_address);
    console.log('Geolocation data:', geoData);

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
    console.log('💾 Inserting conversion:', {
      siteId: site.id,
      pageId,
      pagePath: page_path,
      eventType: event_type,
      device,
      timestamp: new Date().toISOString()
    });

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
        city: geoData.city,
        region: geoData.region,
        country: geoData.country,
        country_code: geoData.country_code,
      });

    if (insertError) {
      console.error('❌ Error inserting conversion:', {
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

    console.log('✅ Conversion saved successfully:', {
      siteName: site_name,
      eventType: event_type
    });

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
