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

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract token from header or query parameter
    const apiToken = req.headers.get('x-api-token') || url.searchParams.get('token');
    
    console.log('📥 Request received:', {
      method: req.method,
      path: url.pathname,
      hasToken: !!apiToken,
    });

    if (!apiToken) {
      console.error('❌ Missing API token');
      return new Response(
        JSON.stringify({ error: 'API token is required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ROUTE: Test connection (any GET request)
    if (req.method === 'GET') {
      console.log('🔍 Testing connection for token:', apiToken.substring(0, 8) + '...');
      
      const { data: source, error: sourceError } = await supabase
        .from('external_lead_sources')
        .select('*')
        .eq('api_token', apiToken)
        .single();

      if (sourceError || !source) {
        console.error('❌ Invalid token or source not found');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Token inválido ou integração não encontrada' 
          }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!source.is_active) {
        console.warn('⚠️ Integration is inactive');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Integração está desativada. Ative-a no painel do RankiTO CRM.' 
          }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Connection test successful:', source.source_name);

      return new Response(
        JSON.stringify({ 
          success: true,
          integration: {
            name: source.source_name,
            type: source.source_type,
            is_active: source.is_active,
            stats: source.stats || { total_leads: 0, last_lead_at: null }
          },
          message: `Integração "${source.source_name}" conectada com sucesso!`
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ROUTE: Capture lead (POST)
    if (req.method === 'POST') {
      console.log('📝 Processing lead capture');

      // Validate token and get source
      const { data: source, error: sourceError } = await supabase
        .from('external_lead_sources')
        .select('*')
        .eq('api_token', apiToken)
        .single();

      if (sourceError || !source) {
        console.error('❌ Invalid API token');
        return new Response(
          JSON.stringify({ error: 'Invalid API token' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!source.is_active) {
        console.warn('⚠️ Integration is inactive');
        return new Response(
          JSON.stringify({ error: 'Integration is inactive' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse and validate lead data
      const leadData = await req.json();
      
      console.log('📊 Lead data received:', {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        page_url: leadData.page_url,
      });

      if (!leadData.name || leadData.name.trim().length < 2) {
        console.error('❌ Invalid name (too short)');
        return new Response(
          JSON.stringify({ error: 'Name is required (minimum 2 characters)' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate lead score based on data quality
      let leadScore = 50; // Base score
      
      if (leadData.phone) {
        leadScore += 20;
        console.log('  ✅ Phone provided: +20 points');
      }
      if (leadData.email) {
        leadScore += 15;
        console.log('  ✅ Email provided: +15 points');
      }
      if (leadData.message && leadData.message.length > 50) {
        leadScore += 10;
        console.log('  ✅ Detailed message: +10 points');
      }
      if (leadData.message && leadData.message.length > 150) {
        leadScore += 5;
        console.log('  ✅ Very detailed message: +5 points');
      }

      console.log(`📈 Calculated lead score: ${leadScore}`);

      // Get default stage from user settings
      const { data: settings } = await supabase
        .from('auto_conversion_settings')
        .select('default_stage')
        .eq('user_id', source.user_id)
        .single();

      const defaultStage = settings?.default_stage || 'lead';
      console.log(`📍 Using stage: ${defaultStage}`);

      // Create deal in CRM
      const { data: deal, error: dealError } = await supabase
        .from('crm_deals')
        .insert({
          user_id: source.user_id,
          title: `${leadData.name} - ${source.source_name}`,
          description: leadData.message || 'Lead capturado via formulário WordPress',
          contact_name: leadData.name,
          contact_email: leadData.email || null,
          contact_phone: leadData.phone || null,
          stage: defaultStage,
          value: 0,
          source: `external_${source.source_type}`,
          external_source: source.source_name,
          source_metadata: {
            source_type: leadData.source_type || 'wordpress',
            source_id: source.id,
            page_url: leadData.page_url,
            page_title: leadData.page_title,
            captured_at: new Date().toISOString(),
            user_agent: req.headers.get('user-agent'),
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            engagement_metrics: leadData.engagement_metrics || null,
          },
          lead_score: leadScore,
        })
        .select()
        .single();

      if (dealError) {
        console.error('❌ Failed to create deal:', dealError);
        return new Response(
          JSON.stringify({ error: 'Failed to create deal in CRM' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Deal created successfully:', deal.id);

      // Update source statistics
      const currentStats = source.stats || { total_leads: 0 };
      await supabase
        .from('external_lead_sources')
        .update({
          stats: {
            total_leads: (currentStats.total_leads || 0) + 1,
            last_lead_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', source.id);

      console.log('📊 Stats updated for source:', source.id);

      // Log activity
      await supabase
        .from('crm_activities')
        .insert({
          user_id: source.user_id,
          deal_id: deal.id,
          activity_type: 'lead_captured',
          title: 'Lead capturado via WordPress',
          description: `Lead capturado via ${source.source_name}`,
          metadata: {
            source: source.source_name,
            page_url: leadData.page_url,
            page_title: leadData.page_title,
          },
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          deal_id: deal.id,
          lead_score: leadScore,
          message: 'Lead captured successfully'
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('❌ Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Internal server error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
