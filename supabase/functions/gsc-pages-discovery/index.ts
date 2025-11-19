import { createClient } from 'npm:@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-jwt-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Busca TODAS as páginas do GSC Search Analytics com paginação automática
 */
async function fetchAllPagesFromGSC(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  let allRows: any[] = [];
  let startRow = 0;
  const rowLimit = 25000; // Máximo permitido pelo Google

  while (true) {
    console.log(`📥 Fetching pages starting at row ${startRow}...`);
    
    const response = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          searchType: 'web',
          dataState: 'final',
          dimensions: ['page'],
          rowLimit,
          startRow,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GSC API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const batch = data.rows || [];
    allRows.push(...batch);

    console.log(`✅ Fetched ${batch.length} pages (total: ${allRows.length})`);

    if (batch.length < rowLimit) break; // Última página
    startRow += rowLimit;
  }

  return allRows;
}

/**
 * Insere dados de analytics em lotes
 */
async function insertAnalyticsBatch(supabase: any, rows: any[]): Promise<void> {
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('gsc_search_analytics')
      .upsert(batch, {
        onConflict: 'site_id,page,query,date,device',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }

    console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} rows)`);
  }
}

/**
 * Insere URLs descobertas em lotes
 */
async function insertDiscoveredUrlsBatch(supabase: any, urls: any[]): Promise<void> {
  const batchSize = 500;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const { error } = await supabase
      .from('gsc_discovered_urls')
      .upsert(batch, {
        onConflict: 'site_id,url',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`❌ Error inserting discovered URLs batch ${i / batchSize + 1}:`, error);
      throw error;
    }

    console.log(`✅ Inserted discovered URLs batch ${i / batchSize + 1} (${batch.length} URLs)`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('🔍 GSC Pages Discovery - Request received');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { site_id, integration_id, months = 16 } = await req.json();

    if (!site_id || !integration_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, integration_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Discovering pages for site ${site_id} (last ${months} months)`);

    // Buscar integração e gerar access token
    const integration = await getIntegrationWithValidToken(integration_id);

    // Calcular período
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    console.log(`📅 Period: ${startDate} to ${endDate}`);

    // Criar job
    const { data: job, error: jobError } = await supabase
      .from('gsc_indexing_jobs')
      .insert({
        site_id,
        integration_id,
        job_type: 'discovery',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Error creating job:', jobError);
      throw jobError;
    }

    console.log(`✅ Job created: ${job.id}`);

    // Buscar todas as páginas do GSC
    const allPages = await fetchAllPagesFromGSC(
      integration.access_token,
      integration.gsc_property_url,
      startDate,
      endDate
    );

    console.log(`🎯 Total pages discovered: ${allPages.length}`);

    // Preparar dados para inserção
    const analyticsData = allPages.map((row: any) => ({
      site_id,
      integration_id,
      page: row.keys[0],
      query: null, // Agregado por página
      date: endDate,
      device: null,
      country: null,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    // Inserir em lotes
    await insertAnalyticsBatch(supabase, analyticsData);

    // Preparar URLs descobertas para inserção
    const discoveredUrls = allPages.map((row: any) => ({
      site_id,
      integration_id,
      url: row.keys[0],
      current_status: 'discovered',
      last_seen_at: new Date().toISOString(),
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    console.log(`📝 Inserting ${discoveredUrls.length} URLs into gsc_discovered_urls...`);
    await insertDiscoveredUrlsBatch(supabase, discoveredUrls);
    console.log(`✅ Discovered URLs inserted successfully`);

    // Atualizar job
    const duration = Date.now() - startTime;
    await supabase
      .from('gsc_indexing_jobs')
      .update({
        status: 'completed',
        urls_processed: allPages.length,
        urls_successful: allPages.length,
        urls_failed: 0,
        completed_at: new Date().toISOString(),
        results: {
          pages_discovered: allPages.length,
          urls_inserted_analytics: allPages.length,
          urls_inserted_discovered: discoveredUrls.length,
          period: { startDate, endDate },
          duration_ms: duration,
        },
      })
      .eq('id', job.id);

    console.log(`✅ Discovery completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        pages_discovered: allPages.length,
        pages_inserted: allPages.length,
        job_id: job.id,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
