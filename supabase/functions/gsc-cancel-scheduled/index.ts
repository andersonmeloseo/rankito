import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { submission_ids } = await req.json();

    console.log('🚫 Cancelando agendamentos:', submission_ids);

    if (!submission_ids || !Array.isArray(submission_ids) || submission_ids.length === 0) {
      throw new Error('submission_ids deve ser um array não vazio');
    }

    // Cancelar submissões
    const { data: cancelled, error: cancelError } = await supabase
      .from('gsc_scheduled_submissions')
      .update({ status: 'cancelled' })
      .in('id', submission_ids)
      .eq('status', 'pending')
      .select();

    if (cancelError) throw cancelError;

    // Limpar scheduled_for das URLs descobertas
    for (const submission of cancelled || []) {
      if (submission.submission_type === 'auto_distribution' && submission.urls) {
        await supabase
          .from('gsc_discovered_urls')
          .update({ scheduled_for: null })
          .eq('site_id', submission.site_id)
          .in('url', submission.urls);
      }
    }

    console.log(`✅ ${cancelled?.length || 0} agendamentos cancelados`);

    return new Response(
      JSON.stringify({
        success: true,
        cancelled_count: cancelled?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro ao cancelar:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
