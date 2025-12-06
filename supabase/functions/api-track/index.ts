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
      exit_url,
      referrer: payloadReferrer,
      // Ads tracking fields (Google Ads + Meta Ads)
      gclid,
      fbclid,
      fbc,
      fbp,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term
    } = await req.json();

    // Lista de event_types válidos
    const validEventTypes = [
      'page_view', 
      'page_exit',
      'whatsapp_click', 
      'phone_click', 
      'email_click', 
      'button_click',
      'form_submit',
      'test',
      // E-commerce events
      'product_view', 
      'add_to_cart', 
      'remove_from_cart', 
      'begin_checkout', 
      'purchase', 
      'search',
      // Engagement events
      'scroll_depth'
    ];

    // Rejeitar silenciosamente eventos não suportados
    if (!validEventTypes.includes(event_type)) {
      console.log(`⚠️ Ignoring unsupported event type: ${event_type}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored - unsupported type' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-detectar tipo de clique baseado na URL de destino
    const autoDetectEventType = (
      eventType: string, 
      metadata: any, 
      ctaText: string | null
    ): string => {
      // Só reclassificar se for button_click genérico
      if (eventType !== 'button_click') return eventType;
      
      const clickUrl = metadata?.url || metadata?.href || '';
      const clickUrlLower = clickUrl.toLowerCase();
      const ctaLower = (ctaText || '').toLowerCase();
      
      // Detectar WhatsApp
      if (
        clickUrlLower.includes('wa.me') || 
        clickUrlLower.includes('whatsapp') || 
        clickUrlLower.includes('api.whatsapp.com') ||
        ctaLower.includes('whatsapp')
      ) {
        console.log('🔄 Auto-detected: button_click → whatsapp_click');
        return 'whatsapp_click';
      }
      
      // Detectar Telefone
      if (clickUrlLower.startsWith('tel:') || ctaLower.includes('ligar')) {
        console.log('🔄 Auto-detected: button_click → phone_click');
        return 'phone_click';
      }
      
      // Detectar Email
      if (clickUrlLower.startsWith('mailto:')) {
        console.log('🔄 Auto-detected: button_click → email_click');
        return 'email_click';
      }
      
      return eventType;
    };

    // Aplicar auto-detecção inteligente de cliques
    const detectedEventType = autoDetectEventType(event_type, metadata, cta_text);

    // Log se houve reclassificação
    if (detectedEventType !== event_type) {
      console.log(`🔄 Event type auto-corrected: ${event_type} → ${detectedEventType}`);
    }

    // Detectar se é evento e-commerce
    const ecommerceEvents = [
      'product_view', 
      'add_to_cart', 
      'remove_from_cart', 
      'begin_checkout', 
      'purchase', 
      'search'
    ];
    const isEcommerceEvent = ecommerceEvents.includes(detectedEventType);

    console.log('✅ Valid tracking event:', { token, site_name, page_url, event_type: detectedEventType, is_ecommerce: isEcommerceEvent, session_id, sequence_number });

    // Validate required fields
    if (!page_url || !event_type) {
      console.error('❌ Missing required fields:', { page_url, event_type });
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
    // Buscar referrer de múltiplas fontes (prioridade: payload raiz > metadata > HTTP header)
    const referrer = payloadReferrer || metadata?.referrer || req.headers.get('referer') || null;
    
    if (referrer) {
      console.log('📍 Referrer captured:', referrer);
    }

    // Detect bot and identify it
    const detectBot = (userAgent: string, city: string | null): { isBot: boolean; botName: string | null } => {
      const ua = userAgent.toLowerCase();
      
      // Map de padrões de bots com nomes descritivos
      const botPatterns = [
        { pattern: 'googlebot', name: 'Bot do Google' },
        { pattern: 'bingbot', name: 'Bot do Bing' },
        { pattern: 'slurp', name: 'Bot do Yahoo' },
        { pattern: 'duckduckbot', name: 'Bot do DuckDuckGo' },
        { pattern: 'baiduspider', name: 'Bot do Baidu' },
        { pattern: 'yandexbot', name: 'Bot do Yandex' },
        { pattern: 'facebookexternalhit', name: 'Bot do Facebook' },
        { pattern: 'twitterbot', name: 'Bot do Twitter' },
        { pattern: 'linkedinbot', name: 'Bot do LinkedIn' },
        { pattern: 'applebot', name: 'Bot da Apple' },
        { pattern: 'uptimerobot', name: 'UptimeRobot Monitor' },
        { pattern: 'pingdom', name: 'Pingdom Monitor' },
        { pattern: 'statuscake', name: 'StatusCake Monitor' },
        { pattern: 'headless', name: 'Browser Headless' },
        { pattern: 'phantom', name: 'PhantomJS Bot' },
        { pattern: 'selenium', name: 'Selenium Bot' },
        { pattern: 'bot', name: 'Bot Genérico' },
        { pattern: 'crawler', name: 'Web Crawler' },
        { pattern: 'spider', name: 'Web Spider' },
        { pattern: 'scraper', name: 'Web Scraper' }
      ];
      
      // Identificar bot pelo User-Agent
      for (const bot of botPatterns) {
        if (ua.includes(bot.pattern)) {
          return { isBot: true, botName: bot.name };
        }
      }
      
      // Cidades conhecidas de datacenters
      const datacenterInfo: Record<string, string> = {
        'Quincy': 'Datacenter Microsoft',
        'The Dalles': 'Datacenter Google',
        'Council Bluffs': 'Datacenter Google',
        'Mountain View': 'Bot do Google',
        'Ashburn': 'Datacenter AWS',
        'Santa Clara': 'Datacenter Digital Ocean',
        'Hillsboro': 'Datacenter Intel',
        'Frankfurt': 'Bot do Bing/Datacenter',
        'Amsterdam': 'Datacenter',
        'Dublin': 'Datacenter AWS',
        'London': 'Datacenter',
        'Singapore': 'Datacenter',
        'Tokyo': 'Datacenter',
        'Mumbai': 'Datacenter',
        'Seoul': 'Datacenter'
      };
      
      // Identificar por cidade suspeita
      if (city && datacenterInfo[city]) {
        return { isBot: true, botName: datacenterInfo[city] };
      }
      
      return { isBot: false, botName: null };
    };

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

    // ========== CONVERSION GOALS VALIDATION ==========
    interface ConversionGoalMatch {
      isConversion: boolean;
      goalId: string | null;
      goalName: string | null;
      conversionValue: number | null;
      hasConfiguredGoals: boolean;
    }

    const checkConversionGoals = async (
      siteId: string,
      eventType: string,
      ctaText: string | null,
      pagePath: string,
      metadata: any
    ): Promise<ConversionGoalMatch> => {
      // Fetch active goals for this site, ordered by priority
      const { data: goals, error } = await supabase
        .from('conversion_goals')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) {
        console.error('❌ Error fetching conversion goals:', error);
        return { isConversion: true, goalId: null, goalName: null, conversionValue: null, hasConfiguredGoals: false };
      }

      // If no goals configured, maintain backward compatibility (everything counts)
      if (!goals || goals.length === 0) {
        return { isConversion: true, goalId: null, goalName: null, conversionValue: null, hasConfiguredGoals: false };
      }

      // page_view and page_exit are not conversions - always allow them for tracking
      if (eventType === 'page_view' || eventType === 'page_exit') {
        return { isConversion: true, goalId: null, goalName: null, conversionValue: null, hasConfiguredGoals: true };
      }

      const ctaLower = (ctaText || '').toLowerCase().trim();
      const clickUrl = (metadata?.url || metadata?.href || '').toLowerCase();

      // Check each goal in priority order
      for (const goal of goals) {
        let matches = false;

        switch (goal.goal_type) {
          case 'cta_match': {
            // Check exact matches first
            if (goal.cta_exact_matches && goal.cta_exact_matches.length > 0) {
              const exactMatch = goal.cta_exact_matches.some((exact: string) => 
                ctaLower === exact.toLowerCase().trim()
              );
              if (exactMatch) matches = true;
            }
            
            // Check pattern matches (partial)
            if (!matches && goal.cta_patterns && goal.cta_patterns.length > 0) {
              const patternMatch = goal.cta_patterns.some((pattern: string) => 
                ctaLower.includes(pattern.toLowerCase().trim())
              );
              if (patternMatch) matches = true;
            }
            break;
          }

          case 'page_destination': {
            // Check if current page is in the list
            if (goal.page_urls && goal.page_urls.length > 0) {
              matches = goal.page_urls.some((url: string) => 
                pagePath.includes(url) || url.includes(pagePath)
              );
            }
            break;
          }

          case 'url_pattern': {
            // Check if click destination URL matches patterns
            if (goal.url_patterns && goal.url_patterns.length > 0) {
              matches = goal.url_patterns.some((pattern: string) => 
                clickUrl.includes(pattern.toLowerCase())
              );
            }
            break;
          }

          case 'combined': {
            // All configured conditions must be met
            let ctaMatch = true;
            let pageMatch = true;
            let urlMatch = true;

            // CTA condition
            if (goal.cta_exact_matches?.length > 0 || goal.cta_patterns?.length > 0) {
              ctaMatch = false;
              if (goal.cta_exact_matches?.length > 0) {
                ctaMatch = goal.cta_exact_matches.some((exact: string) => 
                  ctaLower === exact.toLowerCase().trim()
                );
              }
              if (!ctaMatch && goal.cta_patterns?.length > 0) {
                ctaMatch = goal.cta_patterns.some((pattern: string) => 
                  ctaLower.includes(pattern.toLowerCase().trim())
                );
              }
            }

            // Page condition
            if (goal.page_urls?.length > 0) {
              pageMatch = goal.page_urls.some((url: string) => 
                pagePath.includes(url) || url.includes(pagePath)
              );
            }

            // URL pattern condition
            if (goal.url_patterns?.length > 0) {
              urlMatch = goal.url_patterns.some((pattern: string) => 
                clickUrl.includes(pattern.toLowerCase())
              );
            }

            matches = ctaMatch && pageMatch && urlMatch;
            break;
          }

          case 'scroll_depth': {
            // Check if scroll depth percentage meets threshold
            const scrollPercent = metadata?.scroll_depth || 0;
            if (goal.min_scroll_depth && scrollPercent >= goal.min_scroll_depth) {
              console.log(`📜 Scroll depth ${scrollPercent}% meets threshold ${goal.min_scroll_depth}%`);
              matches = true;
            }
            break;
          }

          case 'time_on_page': {
            // Check if time spent meets threshold
            const timeSpent = metadata?.time_spent_seconds || 0;
            if (goal.min_time_seconds && timeSpent >= goal.min_time_seconds) {
              console.log(`⏱️ Time spent ${timeSpent}s meets threshold ${goal.min_time_seconds}s`);
              matches = true;
            }
            break;
          }
        }

        if (matches) {
          console.log(`✅ Goal matched: "${goal.goal_name}" (${goal.goal_type})`);
          return {
            isConversion: true,
            goalId: goal.id,
            goalName: goal.goal_name,
            conversionValue: goal.conversion_value,
            hasConfiguredGoals: true
          };
        }
      }

      // Has goals but none matched - NOT a conversion
      console.log(`⚠️ Event did not match any conversion goal (CTA: "${ctaText}")`);
      return { isConversion: false, goalId: null, goalName: null, conversionValue: null, hasConfiguredGoals: true };
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
        // Detect if this is a bot
        const { isBot, botName } = detectBot(user_agent, geoData.city);
        
        if (isBot && botName) {
          console.log('🤖 Bot detected:', botName, '| City:', geoData.city);
        }
        
        // Create new session (including bots for monitoring)
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
            country: geoData.country,
            bot_name: botName
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
      // CRITICAL: Only create page_visits when ALL session data is present
      if (detectedEventType === 'page_view' && dbSessionId && sequence_number !== undefined && sequence_number !== null) {
        console.log('📄 Creating page visit:', { dbSessionId, sequence_number, page_url });
        
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
          console.error('❌ Error creating page visit:', visitError);
        } else {
          console.log('✅ Page visit created successfully');
        }

        // Update session pages count
        await supabase
          .from('rank_rent_sessions')
          .update({ 
            pages_visited: existingSession ? existingSession.pages_visited + 1 : 1 
          })
          .eq('id', dbSessionId);
      } else if (detectedEventType === 'page_view') {
        console.log('⚠️ Skipping page visit creation - missing required data:', { 
          hasDbSessionId: !!dbSessionId, 
          hasSequenceNumber: sequence_number !== undefined && sequence_number !== null,
          sequence_number 
        });
      }

      // Handle page_exit event - update visit time and session exit
      if (detectedEventType === 'page_exit' && dbSessionId && time_spent_seconds !== undefined) {
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

    // Extract cta_text from metadata if not provided at root level
    const finalCtaText = (() => {
      const root = cta_text?.trim();
      const meta = metadata?.cta_text?.trim();
      return root || meta || null;
    })();

    // Check conversion goals BEFORE inserting
    const goalMatch = await checkConversionGoals(
      site.id,
      detectedEventType,
      finalCtaText,
      page_path,
      metadata
    );

    // If site has configured goals and event doesn't match any, skip insert for non-tracking events
    if (goalMatch.hasConfiguredGoals && !goalMatch.isConversion) {
      console.log(`🚫 Event skipped - no matching conversion goal (site has ${goalMatch.hasConfiguredGoals ? 'goals configured' : 'no goals'})`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event received but not a configured conversion' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert conversion with goal data and ads tracking
    const { error: insertError } = await supabase
      .from('rank_rent_conversions')
      .insert({
        site_id: site.id,
        page_id: pageId,
        page_url,
        page_path,
        event_type: detectedEventType,
        cta_text: finalCtaText,
        is_ecommerce_event: isEcommerceEvent,
        session_id: session_id || null,
        sequence_number: sequence_number || null,
        time_spent_seconds: time_spent_seconds || null,
        goal_id: goalMatch.goalId,
        goal_name: goalMatch.goalName,
        conversion_value: goalMatch.conversionValue,
        // Ads tracking fields (Google Ads + Meta Ads)
        gclid: gclid || null,
        fbclid: fbclid || null,
        fbc: fbc || null,
        fbp: fbp || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        metadata: { 
          ...metadata, 
          device,
          detected_at: new Date().toISOString(),
          matched_goal: goalMatch.goalName || null
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
        data: { site_id: site.id, page_id: pageId, event_type: detectedEventType, goal_id: goalMatch.goalId }
      });
      return new Response(
        JSON.stringify({ error: 'Failed to save conversion', details: insertError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Conversion saved successfully for site:', site_name, goalMatch.goalName ? `(Goal: ${goalMatch.goalName})` : '');

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
