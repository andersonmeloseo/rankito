import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      .select('user_id')
      .eq('api_token', apiToken)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone } = await req.json();
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Telefone não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone (remove special chars)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Search for deals with this phone
    const { data: deals, error: dealsError } = await supabase
      .from('crm_deals')
      .select(`
        id,
        title,
        stage,
        value,
        created_at,
        contact_name,
        contact_phone
      `)
      .eq('user_id', source.user_id)
      .or(`contact_phone.ilike.%${normalizedPhone}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (dealsError) {
      throw dealsError;
    }

    // For each deal, fetch recent activities and notes
    const dealsWithHistory = await Promise.all(
      (deals || []).map(async (deal) => {
        // Get last 3 activities
        const { data: activities } = await supabase
          .from('crm_activities')
          .select('activity_type, title, created_at')
          .eq('deal_id', deal.id)
          .order('created_at', { ascending: false })
          .limit(3);

        // Get last 2 notes
        const { data: notes } = await supabase
          .from('crm_notes')
          .select('content, created_at')
          .eq('deal_id', deal.id)
          .order('created_at', { ascending: false })
          .limit(2);

        // Get pending tasks
        const { data: tasks } = await supabase
          .from('crm_tasks')
          .select('title, due_date')
          .eq('deal_id', deal.id)
          .eq('completed', false)
          .order('due_date', { ascending: true });

        const lastActivity = activities?.[0];
        const notesPreview = notes?.[0]?.content?.substring(0, 100);

        return {
          id: deal.id,
          title: deal.title,
          stage: deal.stage,
          value: deal.value,
          created_at: deal.created_at,
          last_activity: lastActivity 
            ? `${lastActivity.title} - ${new Date(lastActivity.created_at).toLocaleDateString('pt-BR')}`
            : 'Nenhuma atividade',
          notes_preview: notesPreview || 'Sem notas',
          pending_tasks: tasks?.length || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        total_deals: dealsWithHistory.length,
        deals: dealsWithHistory,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Get History] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
