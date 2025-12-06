import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA256 hash function for Meta CAPI
async function sha256Hash(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate if a string is a valid SHA256 hash (64 hex characters)
function isValidSha256(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      siteId, 
      pixelId, 
      accessToken, 
      startDate, 
      endDate, 
      goalIds,
      testEventCode,
      mode = 'export' // 'export' for JSON download, 'send' for API call
    } = await req.json();

    if (!siteId) {
      return new Response(
        JSON.stringify({ error: 'siteId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[export-meta] Processing conversions for site ${siteId}, mode: ${mode}`);

    // Build query for conversions (with fbclid or fbc/fbp)
    let query = supabase
      .from('rank_rent_conversions')
      .select(`
        id, created_at, event_type, 
        fbclid, fbc, fbp, 
        conversion_value, cta_text, page_url,
        ip_address, user_agent,
        city, region, country, country_code,
        email_hash, phone_hash,
        goal_id, session_id
      `)
      .eq('site_id', siteId)
      .or('fbclid.not.is.null,fbc.not.is.null,fbp.not.is.null')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (goalIds && goalIds.length > 0) {
      query = query.in('goal_id', goalIds);
    }

    const { data: conversions, error } = await query;

    if (error) {
      console.error('[export-meta] Query error:', error);
      throw error;
    }

    console.log(`[export-meta] Found ${conversions?.length || 0} conversions with Meta identifiers`);

    // Fetch goal names
    let goalNames: Record<string, string> = {};
    if (conversions && conversions.length > 0) {
      const uniqueGoalIds = [...new Set(conversions.map(c => c.goal_id).filter(Boolean))];
      if (uniqueGoalIds.length > 0) {
        const { data: goals } = await supabase
          .from('conversion_goals')
          .select('id, goal_name')
          .in('id', uniqueGoalIds);
        
        if (goals) {
          goalNames = Object.fromEntries(goals.map(g => [g.id, g.goal_name]));
        }
      }
    }

    // Map event types to Meta standard events
    const eventTypeMap: Record<string, string> = {
      'whatsapp_click': 'Lead',
      'phone_click': 'Lead',
      'email_click': 'Lead',
      'form_submit': 'Lead',
      'button_click': 'Lead',
      'purchase': 'Purchase',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'product_view': 'ViewContent'
    };

    // Build Meta CAPI events with async hashing using Promise.all
    const events = await Promise.all((conversions || []).map(async (conv) => {
      const eventTime = Math.floor(new Date(conv.created_at).getTime() / 1000);
      
      // Determine event name
      let eventName = 'Lead';
      if (conv.goal_id && goalNames[conv.goal_id]) {
        // Custom event name from goal
        eventName = goalNames[conv.goal_id].replace(/\s+/g, '');
      } else if (conv.event_type && eventTypeMap[conv.event_type]) {
        eventName = eventTypeMap[conv.event_type];
      }

      // Build user_data object
      const userData: Record<string, any> = {};
      
      // Add Meta identifiers
      if (conv.fbc) userData.fbc = conv.fbc;
      if (conv.fbp) userData.fbp = conv.fbp;
      if (conv.fbclid) userData.fbclid = conv.fbclid;
      
      // Add hashed PII if available (validate they are proper SHA256 hashes)
      if (conv.email_hash) {
        if (isValidSha256(conv.email_hash)) {
          userData.em = [conv.email_hash];
        } else {
          // Hash it if it's plain text
          userData.em = [await sha256Hash(conv.email_hash)];
        }
      }
      if (conv.phone_hash) {
        if (isValidSha256(conv.phone_hash)) {
          userData.ph = [conv.phone_hash];
        } else {
          // Hash it if it's plain text
          userData.ph = [await sha256Hash(conv.phone_hash)];
        }
      }
      
      // Add IP and user agent for matching (required for website events)
      if (conv.ip_address) userData.client_ip_address = conv.ip_address;
      if (conv.user_agent) userData.client_user_agent = conv.user_agent;
      
      // Add location data with proper async hashing
      if (conv.city) userData.ct = [await sha256Hash(conv.city)];
      if (conv.region) userData.st = [await sha256Hash(conv.region)];
      if (conv.country_code) userData.country = [await sha256Hash(conv.country_code.toLowerCase())];

      // Add external_id for better matching if session_id exists
      if (conv.session_id) {
        userData.external_id = [await sha256Hash(conv.session_id)];
      }

      // Build custom_data
      const customData: Record<string, any> = {
        currency: 'BRL'
      };
      
      if (conv.conversion_value) {
        customData.value = conv.conversion_value;
      }
      if (conv.page_url) {
        customData.content_name = conv.page_url;
      }
      if (conv.cta_text) {
        customData.content_category = conv.cta_text;
      }

      return {
        event_name: eventName,
        event_time: eventTime,
        event_id: conv.id,
        event_source_url: conv.page_url,
        action_source: 'website',
        user_data: userData,
        custom_data: customData,
        data_processing_options: [] // Required for compliance (empty = no restrictions)
      };
    }));

    // Mode: Export JSON
    if (mode === 'export') {
      return new Response(
        JSON.stringify({ 
          data: events,
          total: events.length,
          format: 'meta_capi_v18'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="meta-conversions-${siteId}-${new Date().toISOString().split('T')[0]}.json"`
          } 
        }
      );
    }

    // Mode: Send to Meta CAPI
    if (mode === 'send') {
      if (!pixelId || !accessToken) {
        return new Response(
          JSON.stringify({ error: 'pixelId and accessToken are required for send mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Meta CAPI endpoint
      const capiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events`;

      // Send in batches of 1000 (Meta limit)
      const batchSize = 1000;
      const results = [];

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        const payload: Record<string, any> = {
          data: batch,
          access_token: accessToken
        };

        // Add test event code for debugging
        if (testEventCode) {
          payload.test_event_code = testEventCode;
        }

        console.log(`[export-meta] Sending batch ${i / batchSize + 1} with ${batch.length} events`);

        const response = await fetch(capiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        results.push({
          batch: i / batchSize + 1,
          sent: batch.length,
          response: result
        });

        if (!response.ok) {
          console.error(`[export-meta] Batch ${i / batchSize + 1} failed:`, result);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          total_events: events.length,
          batches: results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode. Use "export" or "send"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[export-meta] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
