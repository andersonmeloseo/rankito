import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API token from headers
    const apiToken = req.headers.get('x-api-token');
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'Token da API não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token and get user_id
    const { data: source, error: sourceError } = await supabase
      .from('external_lead_sources')
      .select('user_id, is_active')
      .eq('api_token', apiToken)
      .eq('source_type', 'chrome_extension')
      .single();

    if (sourceError || !source) {
      console.error('[WhatsApp] Token inválido:', sourceError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!source.is_active) {
      return new Response(
        JSON.stringify({ error: 'Integração desativada' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { name, phone, message, stage, notes, metadata } = await req.json();

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Nome e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = source.user_id;

    // Calculate lead score
    let leadScore = 70; // Base score for WhatsApp extension

    // Check for duplicate (same phone in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: duplicates } = await supabase
      .from('crm_deals')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_phone', phone)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (duplicates && duplicates.length > 0) {
      leadScore -= 20; // Re-engagement penalty
    }

    // Bonus for conversation depth (if metadata includes message count)
    if (metadata?.message_count && metadata.message_count > 5) {
      leadScore += 10;
    }

    // Create deal
    const { data: deal, error: dealError } = await supabase
      .from('crm_deals')
      .insert({
        user_id: userId,
        title: `WhatsApp: ${name}`,
        value: 0,
        stage: stage || 'lead',
        contact_name: name,
        contact_phone: phone,
        lead_score: leadScore,
        external_source: 'chrome_extension',
        notes: notes || `Capturado via WhatsApp Web\n\nÚltima mensagem: ${message || 'N/A'}`,
      })
      .select()
      .single();

    if (dealError) {
      console.error('[WhatsApp] Erro ao criar deal:', dealError);
      throw dealError;
    }

    console.log('[WhatsApp] ✅ Deal criado:', deal.id);

    // Create activity
    await supabase.from('crm_activities').insert({
      deal_id: deal.id,
      user_id: userId,
      activity_type: 'lead_created',
      title: 'Lead capturado do WhatsApp Web',
      description: `Contato adicionado via extensão Chrome\nScore: ${leadScore} pontos`,
      metadata: {
        source: 'chrome_extension',
        phone,
        ...metadata,
      },
    });

    // Create note with last message
    if (message) {
      await supabase.from('crm_notes').insert({
        deal_id: deal.id,
        user_id: userId,
        content: `📱 **Última mensagem capturada:**\n\n${message}`,
      });
    }

    // Update source stats
    await supabase.rpc('increment_lead_count', {
      source_id: apiToken,
    });

    return new Response(
      JSON.stringify({
        success: true,
        deal_id: deal.id,
        lead_score: leadScore,
        message: 'Lead criado com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WhatsApp] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
