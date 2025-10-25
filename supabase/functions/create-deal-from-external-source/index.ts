import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-token',
};

interface LeadData {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  company?: string;
  page_url?: string;
  page_title?: string;
  form_name?: string;
  source_type?: 'wordpress_widget' | 'wordpress_form' | 'wordpress_button' | 'chrome_whatsapp' | 'api';
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  custom_fields?: Record<string, any>;
}

const detectDevice = (userAgent: string): string => {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

const extractDomainFromEmail = (email: string): string | null => {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : null;
};

const isFreeEmail = (email: string): boolean => {
  const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com'];
  const domain = extractDomainFromEmail(email);
  return domain ? freeDomains.includes(domain.toLowerCase()) : false;
};

const isTemporaryEmail = (email: string): boolean => {
  const tempDomains = ['mailinator.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com'];
  const domain = extractDomainFromEmail(email);
  return domain ? tempDomains.some(temp => domain.toLowerCase().includes(temp)) : false;
};

const calculateLeadScore = (data: LeadData): number => {
  let score = 0;
  
  // Phone number provided: +30
  if (data.phone && data.phone.length >= 10) score += 30;
  
  // Corporate email (not free): +20
  if (data.email && !isFreeEmail(data.email)) score += 20;
  
  // Company mentioned: +25
  if (data.company) score += 25;
  
  // Detailed message (>50 chars): +15
  if (data.message && data.message.length > 50) score += 15;
  
  // Custom fields filled: +10
  if (data.custom_fields && Object.keys(data.custom_fields).length > 0) score += 10;
  
  return Math.min(score, 100); // Cap at 100
};

const getLeadQuality = (score: number): string => {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API token from header
    const apiToken = req.headers.get('x-api-token');
    if (!apiToken) {
      console.error('No API token provided');
      return new Response(
        JSON.stringify({ error: 'API token is required', code: 'MISSING_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API token and get source info
    const { data: source, error: sourceError } = await supabase
      .from('external_lead_sources')
      .select('*')
      .eq('api_token', apiToken)
      .eq('is_active', true)
      .single();

    if (sourceError || !source) {
      console.error('Invalid or inactive API token:', sourceError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API token', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's default stage configuration
    const { data: autoConfig } = await supabase
      .from('auto_conversion_settings')
      .select('default_stage')
      .eq('user_id', source.user_id)
      .single();

    const targetStage = autoConfig?.default_stage || 'lead';
    console.log(`📍 Using stage: ${targetStage} for user ${source.user_id}`);

    // Parse request body
    const leadData: LeadData = await req.json();
    console.log('Received lead data:', leadData);

    // Validate required fields
    if (!leadData.name || leadData.name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Name is required (min 2 characters)', code: 'INVALID_NAME' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email if provided
    if (leadData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadData.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format', code: 'INVALID_EMAIL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (isTemporaryEmail(leadData.email)) {
        return new Response(
          JSON.stringify({ error: 'Temporary emails are not allowed', code: 'TEMPORARY_EMAIL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for duplicates (same email in last 24 hours)
    if (leadData.email) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: duplicates } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('user_id', source.user_id)
        .eq('contact_email', leadData.email)
        .gte('created_at', twentyFourHoursAgo);

      if (duplicates && duplicates.length > 0) {
        console.log('Duplicate lead detected:', leadData.email);
        return new Response(
          JSON.stringify({ 
            error: 'Duplicate lead - same email submitted in last 24 hours', 
            code: 'DUPLICATE_LEAD',
            existing_deal_id: duplicates[0].id
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Extract metadata from request
    const userAgent = req.headers.get('user-agent') || '';
    const device = detectDevice(userAgent);
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Calculate lead score
    const leadScore = calculateLeadScore(leadData);
    const leadQuality = getLeadQuality(leadScore);

    // Prepare source metadata
    const sourceMetadata = {
      source_type: leadData.source_type || 'api',
      source_name: source.source_name,
      source_id: source.id,
      page_url: leadData.page_url,
      page_title: leadData.page_title,
      form_name: leadData.form_name,
      device: device,
      user_agent: userAgent,
      ip_address: ipAddress,
      utm_source: leadData.utm_source,
      utm_campaign: leadData.utm_campaign,
      utm_medium: leadData.utm_medium,
      lead_quality: leadQuality,
      custom_fields: leadData.custom_fields || {},
      captured_at: new Date().toISOString(),
    };

    // Create deal
    const dealTitle = `${leadData.name} - ${source.source_name}`;
    const dealDescription = leadData.message || `Lead capturado via ${leadData.source_type || 'integração externa'}`;

    const { data: deal, error: dealError } = await supabase
      .from('crm_deals')
      .insert({
        user_id: source.user_id,
        title: dealTitle,
        description: dealDescription,
        contact_name: leadData.name,
        contact_email: leadData.email || null,
        contact_phone: leadData.phone || null,
        stage: targetStage,
        value: 0,
        source: `external_${source.source_type}`,
        external_source: source.source_name,
        source_metadata: sourceMetadata,
        lead_score: leadScore,
      })
      .select()
      .single();

    if (dealError) {
      console.error('Error creating deal:', dealError);
      return new Response(
        JSON.stringify({ error: 'Failed to create deal', details: dealError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deal created successfully:', deal.id);

    // Create activity
    await supabase
      .from('crm_activities')
      .insert({
        user_id: source.user_id,
        deal_id: deal.id,
        activity_type: 'lead_created',
        title: 'Lead capturado automaticamente',
        description: `Lead capturado via ${source.source_name} (${leadData.source_type || 'api'})`,
        metadata: {
          source_type: leadData.source_type,
          page_url: leadData.page_url,
          lead_score: leadScore,
          lead_quality: leadQuality,
        },
      });

    // Update source statistics
    const currentStats = source.stats || { total_leads: 0 };
    await supabase
      .from('external_lead_sources')
      .update({
        stats: {
          ...currentStats,
          total_leads: (currentStats.total_leads || 0) + 1,
          last_lead_at: new Date().toISOString(),
        },
      })
      .eq('id', source.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        deal_id: deal.id,
        lead_score: leadScore,
        lead_quality: leadQuality,
        message: 'Lead captured successfully'
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
