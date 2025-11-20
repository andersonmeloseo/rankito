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

    const { site_id, sitemap_url, scheduled_for, integration_id } = await req.json();

    console.log('📅 Agendando sitemap:', { site_id, sitemap_url, scheduled_for });

    // Validar dados
    if (!site_id || !sitemap_url || !scheduled_for) {
      throw new Error('site_id, sitemap_url e scheduled_for são obrigatórios');
    }

    // Verificar se o sitemap existe
    const { data: sitemap, error: sitemapError } = await supabase
      .from('gsc_sitemap_submissions')
      .select('*')
      .eq('site_id', site_id)
      .eq('sitemap_url', sitemap_url)
      .single();

    if (sitemapError && sitemapError.code !== 'PGRST116') {
      throw sitemapError;
    }

    // Criar agendamento
    const { data: scheduled, error: scheduleError } = await supabase
      .from('gsc_scheduled_submissions')
      .insert({
        site_id,
        integration_id: integration_id || null,
        submission_type: 'sitemap',
        scheduled_for,
        sitemap_url,
        priority: 70,
        status: 'pending',
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    console.log('✅ Sitemap agendado:', scheduled.id);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_submission: scheduled,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro ao agendar sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
