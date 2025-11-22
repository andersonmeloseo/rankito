import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📥 Request received:', {
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
      'origin': req.headers.get('origin')
    }
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract token from URL
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    console.log('🔑 Token extracted:', token ? `${token.substring(0, 10)}...` : 'MISSING');

    if (!token) {
      console.error('❌ Missing tracking token');
      return new Response(
        JSON.stringify({ 
          error: 'Token de rastreamento não fornecido',
          message: 'É necessário fornecer um token válido para registrar eventos.',
          action: 'Verifique se o plugin está instalado corretamente'
        }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET requests (connection tests)
    if (req.method === 'GET') {
      console.log('🧪 Processing GET request - connection test');
      
      const { data: site, error: siteError } = await supabase
        .from('rank_rent_sites')
        .select('id, site_name')
        .eq('tracking_token', token)
        .single();

      if (siteError || !site) {
        console.error('❌ Invalid token for GET request:', token);
        return new Response(
          JSON.stringify({ 
            error: 'Token inválido',
            message: 'O token de rastreamento fornecido não é válido ou não foi encontrado.',
            action: 'Verifique o token nas configurações do projeto'
          }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update plugin installation status
      const { error: updateError } = await supabase
        .from('rank_rent_sites')
        .update({ tracking_pixel_installed: true })
        .eq('id', site.id);

      if (updateError) {
        console.error('⚠️ Error updating plugin status:', updateError);
      } else {
        console.log('✅ Plugin status updated to installed');
      }

      console.log('✅ Connection test successful for site:', site.site_name);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Conexão estabelecida com sucesso!', 
          site_name: site.site_name 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle POST requests (tracking events)

    const { 
      site_name, 
      page_url, 
      event_type, 
      cta_text,
      metadata,
      session_id,
      sequence_number,
      time_spent_seconds,
      exit_url
    } = await req.json();

    // Detectar se é evento e-commerce
    const ecommerceEvents = [
      'product_view', 
      'add_to_cart', 
      'remove_from_cart', 
      'begin_checkout', 
      'purchase', 
      'search'
    ];
    const isEcommerceEvent = ecommerceEvents.includes(event_type);

    console.log('Tracking event:', { token, site_name, page_url, event_type, is_ecommerce: isEcommerceEvent });

    // Validate required fields
    if (!page_url || !event_type) {
      console.error('Missing required fields:', { page_url, event_type });
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios faltando',
          message: 'Os campos page_url e event_type são obrigatórios para registrar eventos.',
          action: 'Verifique se o plugin está enviando todos os dados necessários'
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

    // Get geolocation data usando sistema de rotação de APIs
    const selectNextApi = async (supabase: any) => {
      const { data: apis, error } = await supabase
        .from('geolocation_api_configs')
        .select('*')
        .eq('is_active', true)
        .order('last_rotation_at', { ascending: true, nullsFirst: true })
        .order('priority', { ascending: true })
        .order('error_count', { ascending: true });
      
      if (!apis || apis.length === 0) return null;
      
      const availableApis = apis.filter((api: any) => {
        if (!api.monthly_limit) return true;
        return api.usage_count < api.monthly_limit;
      });
      
      if (availableApis.length === 0) {
        await supabase
          .from('geolocation_api_configs')
          .update({ usage_count: 0 })
          .eq('is_active', true);
        return apis[0];
      }
      
      return availableApis[0];
    };

    const fetchGeolocation = async (provider: string, apiKey: string, ip: string) => {
      switch(provider) {
        case 'ipgeolocation': {
          const res = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ip}`);
          const data = await res.json();
          return {
            city: data.city || null,
            region: data.state_prov || null,
            country: data.country_name || null,
            country_code: data.country_code2 || null
          };
        }
        case 'ipapi': {
          const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,countryCode`);
          const data = await res.json();
          if (data.status !== 'success') throw new Error('API failed');
          return {
            city: data.city || null,
            region: data.regionName || null,
            country: data.country || null,
            country_code: data.countryCode || null
          };
        }
        case 'ipstack': {
          const res = await fetch(`http://api.ipstack.com/${ip}?access_key=${apiKey}`);
          const data = await res.json();
          if (data.error) throw new Error(data.error.info);
          return {
            city: data.city || null,
            region: data.region_name || null,
            country: data.country_name || null,
            country_code: data.country_code || null
          };
        }
        case 'ipinfo': {
          const res = await fetch(`https://ipinfo.io/${ip}/json?token=${apiKey}`);
          const data = await res.json();
          return {
            city: data.city || null,
            region: data.region || null,
            country: data.country || null,
            country_code: data.country || null
          };
        }
        default:
          throw new Error('Unknown provider');
      }
    };

    const tryApiWithFailover = async (supabase: any, ip: string, maxRetries: number = 5) => {
      // Ignorar IPs locais
      if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { city: null, region: null, country: null, country_code: null };
      }

      const cleanIp = ip.split(',')[0].trim();
      let attempts = 0;
      
      while (attempts < maxRetries) {
        const selectedApi = await selectNextApi(supabase);
        
        if (!selectedApi) {
          console.error('❌ No APIs available');
          return { city: null, region: null, country: null, country_code: null };
        }
        
        try {
          console.log(`🔍 Attempt ${attempts + 1}: ${selectedApi.display_name} (${selectedApi.provider_name})`);
          
          const geoData = await fetchGeolocation(
            selectedApi.provider_name, 
            selectedApi.api_key, 
            cleanIp
          );
          
          await supabase
            .from('geolocation_api_configs')
            .update({ 
              usage_count: selectedApi.usage_count + 1,
              last_used_at: new Date().toISOString(),
              last_rotation_at: new Date().toISOString(),
              error_count: 0,
              last_error: null
            })
            .eq('id', selectedApi.id);
          
          console.log(`✅ Success with ${selectedApi.display_name}`);
          return geoData;
          
        } catch (error: any) {
          console.warn(`⚠️ ${selectedApi.display_name} failed: ${error?.message}`);
          
          await supabase
            .from('geolocation_api_configs')
            .update({ 
              error_count: selectedApi.error_count + 1,
              last_error: error?.message || 'Unknown error',
              last_rotation_at: new Date().toISOString()
            })
            .eq('id', selectedApi.id);
          
          if (selectedApi.error_count + 1 >= 10) {
            await supabase
              .from('geolocation_api_configs')
              .update({ is_active: false })
              .eq('id', selectedApi.id);
          }
          
          attempts++;
          continue;
        }
      }
      
      console.error(`❌ All APIs failed after ${maxRetries} attempts`);
      return { city: null, region: null, country: null, country_code: null };
    };

    const geoData = await tryApiWithFailover(supabase, ip_address);

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

    // Handle session tracking
    if (session_id) {
      // Find or create session
      let dbSessionId = null;
      const { data: existingSession } = await supabase
        .from('rank_rent_sessions')
        .select('id, pages_visited')
        .eq('session_id', session_id)
        .eq('site_id', site.id)
        .maybeSingle();

      if (existingSession) {
        dbSessionId = existingSession.id;
      } else {
        // Create new session
        const { data: newSession, error: sessionError } = await supabase
          .from('rank_rent_sessions')
          .insert({
            site_id: site.id,
            session_id,
            entry_page_url: page_url,
            device,
            referrer,
            ip_address,
            city: geoData.city,
            country: geoData.country
          })
          .select('id')
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
        } else if (newSession) {
          dbSessionId = newSession.id;
        }
      }

      // Handle page_view event - create page visit
      if (event_type === 'page_view' && dbSessionId && sequence_number !== undefined) {
        const { error: visitError } = await supabase
          .from('rank_rent_page_visits')
          .insert({
            session_id: dbSessionId,
            site_id: site.id,
            page_url,
            page_title: metadata?.page_title || null,
            sequence_number
          });

        if (visitError) {
          console.error('Error creating page visit:', visitError);
        }

        // Update session pages count
        await supabase
          .from('rank_rent_sessions')
          .update({ 
            pages_visited: existingSession ? existingSession.pages_visited + 1 : 1 
          })
          .eq('id', dbSessionId);
      }

      // Handle page_exit event - update visit time and session exit
      if (event_type === 'page_exit' && dbSessionId && time_spent_seconds !== undefined) {
        // Find the most recent page visit for this session
        const { data: lastVisit } = await supabase
          .from('rank_rent_page_visits')
          .select('id')
          .eq('session_id', dbSessionId)
          .order('sequence_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastVisit) {
          // Update visit with exit time
          await supabase
            .from('rank_rent_page_visits')
            .update({
              exit_time: new Date().toISOString(),
              time_spent_seconds
            })
            .eq('id', lastVisit.id);
        }

        // Update session with exit info
        await supabase
          .from('rank_rent_sessions')
          .update({
            exit_page_url: exit_url || page_url,
            exit_time: new Date().toISOString(),
            total_duration_seconds: time_spent_seconds
          })
          .eq('id', dbSessionId);
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
        is_ecommerce_event: isEcommerceEvent,
        session_id: session_id || null,
        sequence_number: sequence_number || null,
        time_spent_seconds: time_spent_seconds || null,
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
