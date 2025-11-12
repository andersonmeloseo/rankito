import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken } from '../_shared/gsc-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting GSC Indexation Status Check...');
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar páginas que foram enviadas nos últimos 7 dias mas ainda não foram verificadas
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: pagesToCheck, error: pagesError } = await supabase
      .from('rank_rent_pages')
      .select('id, page_url, site_id, gsc_indexation_status')
      .eq('gsc_indexation_status', 'submitted')
      .gte('gsc_last_checked_at', sevenDaysAgo.toISOString())
      .limit(100); // Limitar a 100 páginas por execução

    if (pagesError) {
      throw new Error(`Error fetching pages: ${pagesError.message}`);
    }

    if (!pagesToCheck || pagesToCheck.length === 0) {
      console.log('ℹ️ No pages to check');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No submitted pages found to verify',
          checked: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${pagesToCheck.length} pages to verify`);

    let verified = 0;
    let indexed = 0;
    let errors = 0;

    // Agrupar páginas por site para buscar integrações
    const pagesBySite = new Map<string, typeof pagesToCheck>();
    pagesToCheck.forEach(page => {
      const sitePages = pagesBySite.get(page.site_id) || [];
      sitePages.push(page);
      pagesBySite.set(page.site_id, sitePages);
    });

    // Processar cada site
    for (const [siteId, pages] of pagesBySite) {
      try {
        // Buscar uma integração ativa do site
        const { data: integrations, error: intError } = await supabase
          .from('google_search_console_integrations')
          .select('id')
          .eq('site_id', siteId)
          .eq('is_active', true)
          .limit(1);

        if (intError || !integrations || integrations.length === 0) {
          console.log(`⚠️ No active integration for site ${siteId}`);
          continue;
        }

        const integration = await getIntegrationWithValidToken(integrations[0].id);
        console.log(`🔐 Using integration for site ${siteId}`);

        // Verificar cada página
        for (const page of pages) {
          try {
            console.log(`🔍 Checking: ${page.page_url}`);

            // Chamar URL Inspection API do Google
            const inspectionResponse = await fetch(
              'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${integration.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  inspectionUrl: page.page_url,
                  siteUrl: integration.gsc_property_url,
                }),
              }
            );

            if (!inspectionResponse.ok) {
              const errorData = await inspectionResponse.json();
              console.error(`❌ Error inspecting ${page.page_url}:`, errorData);
              errors++;
              continue;
            }

            const inspectionData = await inspectionResponse.json();
            console.log(`📊 Inspection result for ${page.page_url}:`, inspectionData.inspectionResult?.indexStatusResult?.verdict);

            // Atualizar status da página baseado no resultado
            const verdict = inspectionData.inspectionResult?.indexStatusResult?.verdict;
            const lastCrawlTime = inspectionData.inspectionResult?.indexStatusResult?.lastCrawlTime;

            let newStatus = 'submitted';
            
            if (verdict === 'PASS' || verdict === 'INDEXED') {
              newStatus = 'indexed';
              indexed++;
            } else if (verdict === 'FAIL' || verdict === 'ERROR') {
              newStatus = 'error';
              errors++;
            }

            // Atualizar página
            await supabase
              .from('rank_rent_pages')
              .update({
                gsc_indexation_status: newStatus,
                gsc_last_crawled_at: lastCrawlTime || null,
                gsc_indexed_at: newStatus === 'indexed' ? new Date().toISOString() : null,
                gsc_last_checked_at: new Date().toISOString(),
              })
              .eq('id', page.id);

            verified++;
            console.log(`✅ Updated status for ${page.page_url}: ${newStatus}`);

          } catch (error) {
            console.error(`❌ Exception checking ${page.page_url}:`, error);
            errors++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing site ${siteId}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Status check complete. Duration: ${duration}ms`);
    console.log(`📊 Stats: Verified=${verified}, Indexed=${indexed}, Errors=${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          total_checked: pagesToCheck.length,
          verified,
          indexed,
          errors,
          duration_ms: duration,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Status check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
