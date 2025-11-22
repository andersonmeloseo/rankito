import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { validateUrls } from "../_shared/url-validation-helpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [gsc-validate-urls] Request received');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Cabeçalho de autorização ausente');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    const { site_id, urls } = await req.json();

    if (!site_id || !urls || !Array.isArray(urls)) {
      throw new Error('site_id e urls (array) são obrigatórios');
    }

    console.log(`📋 Validating ${urls.length} URLs for site ${site_id}`);

    // Buscar site_url
    const { data: site, error: siteError } = await supabase
      .from('rank_rent_sites')
      .select('site_url')
      .eq('id', site_id)
      .single();

    if (siteError || !site) {
      throw new Error('Site não encontrado');
    }

    // Validar URLs
    const validationResults = await validateUrls(
      supabase,
      urls,
      site_id,
      site.site_url
    );

    // Processar resultados
    const results = {
      total: urls.length,
      valid: 0,
      invalid_domain: 0,
      unreachable: 0,
      details: [] as any[]
    };

    for (const [url, result] of validationResults.entries()) {
      results[result.status]++;
      results.details.push({
        url,
        status: result.status,
        error: result.error
      });

      // Atualizar banco com status de validação
      await supabase
        .from('gsc_discovered_urls')
        .update({
          validation_status: result.status,
          validation_error: result.error,
          validated_at: new Date().toISOString()
        })
        .eq('site_id', site_id)
        .eq('url', url);
    }

    console.log(`✅ Validation complete: ${results.valid} valid, ${results.invalid_domain} invalid domain, ${results.unreachable} unreachable`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Error in gsc-validate-urls:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro desconhecido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
