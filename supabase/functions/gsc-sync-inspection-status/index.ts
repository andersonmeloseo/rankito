import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getIntegrationWithValidToken } from "../_shared/gsc-helpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Consulta status real de indexação via Google Search Console Inspection API
 */
async function inspectUrl(url: string, accessToken: string, siteUrl: string) {
  try {
    const response = await fetch(
      `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: siteUrl,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Inspection API error for ${url}:`, errorData);
      return {
        url,
        status: 'ERROR',
        error: JSON.stringify(errorData),
        data: null
      };
    }

    const data = await response.json();
    
    // Extrair status principal do índice
    const indexStatus = data.inspectionResult?.indexStatusResult?.verdict;
    
    return {
      url,
      status: indexStatus || 'URL_IS_UNKNOWN',
      error: null,
      data: data
    };
  } catch (error: any) {
    console.error(`❌ Error inspecting ${url}:`, error);
    return {
      url,
      status: 'ERROR',
      error: error.message,
      data: null
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [gsc-sync-inspection-status] Starting inspection sync');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar URLs que foram enviadas mas não têm inspection status
    // OU que não foram inspecionadas há mais de 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: urlsToInspect, error: fetchError } = await supabase
      .from('gsc_discovered_urls')
      .select(`
        id,
        url,
        site_id,
        integration_id,
        current_status,
        google_inspection_status,
        google_last_inspected_at
      `)
      .eq('current_status', 'sent')
      .or(`google_inspection_status.is.null,google_last_inspected_at.lt.${sevenDaysAgo.toISOString()}`)
      .order('google_last_inspected_at', { ascending: true, nullsFirst: true })
      .limit(50); // Processar 50 URLs por execução (quota do Inspection API é limitada)

    if (fetchError) {
      throw fetchError;
    }

    if (!urlsToInspect || urlsToInspect.length === 0) {
      console.log('✅ No URLs pending inspection');
      return new Response(JSON.stringify({ message: 'No URLs to inspect', inspected: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`📋 Found ${urlsToInspect.length} URLs to inspect`);

    let inspectedCount = 0;
    let errorCount = 0;

    // Agrupar por site_id
    const urlsBySite = new Map<string, typeof urlsToInspect>();
    for (const url of urlsToInspect) {
      if (!urlsBySite.has(url.site_id)) {
        urlsBySite.set(url.site_id, []);
      }
      urlsBySite.get(url.site_id)!.push(url);
    }

    // Processar cada site
    for (const [siteId, urls] of urlsBySite.entries()) {
      try {
        // Buscar site e integração
        const { data: site } = await supabase
          .from('rank_rent_sites')
          .select('site_url')
          .eq('id', siteId)
          .single();

        if (!site) {
          console.warn(`⚠️ Site ${siteId} not found, skipping`);
          continue;
        }

        // Buscar integração saudável
        const { data: integrations } = await supabase
          .from('google_search_console_integrations')
          .select('*')
          .eq('site_id', siteId)
          .eq('is_active', true)
          .eq('health_status', 'healthy');

        if (!integrations || integrations.length === 0) {
          console.warn(`⚠️ No healthy integrations for site ${siteId}, skipping`);
          continue;
        }

        const integration = integrations[0];
        const integrationData = await getIntegrationWithValidToken(integration);
        const accessToken = integrationData.accessToken;

        // Processar URLs com rate limiting (1 req/sec para evitar quota issues)
        for (const urlData of urls) {
          const result = await inspectUrl(urlData.url, accessToken, integration.gsc_property_url || site.site_url);

          // Atualizar banco com resultado
          await supabase
            .from('gsc_discovered_urls')
            .update({
              google_inspection_status: result.status,
              google_last_inspected_at: new Date().toISOString(),
              google_inspection_data: result.data,
              updated_at: new Date().toISOString()
            })
            .eq('id', urlData.id);

          if (result.status !== 'ERROR') {
            inspectedCount++;
            console.log(`✅ Inspected ${urlData.url}: ${result.status}`);
          } else {
            errorCount++;
            console.error(`❌ Inspection failed for ${urlData.url}`);
          }

          // Rate limiting: 1 segundo entre requisições
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (siteError: any) {
        console.error(`❌ Error processing site ${siteId}:`, siteError);
      }
    }

    console.log(`✅ Inspection sync complete: ${inspectedCount} inspected, ${errorCount} errors`);

    return new Response(JSON.stringify({
      message: 'Inspection sync complete',
      total: urlsToInspect.length,
      inspected: inspectedCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Error in gsc-sync-inspection-status:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro desconhecido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
