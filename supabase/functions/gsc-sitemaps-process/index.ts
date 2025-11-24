import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extrai conteúdo de uma tag XML
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}\\b[^>]*>\\s*([^<]+)\\s*<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Detecta tipo de sitemap
 */
function detectSitemapType(xml: string): 'sitemapindex' | 'urlset' {
  return xml.includes('<sitemapindex') ? 'sitemapindex' : 'urlset';
}

/**
 * Parse de urlset (extrai URLs individuais)
 */
function parseUrlset(xml: string): any[] {
  const results: any[] = [];
  const urlBlocks = xml.match(/<url\b[\s\S]*?<\/url>/gi) || [];

  for (const block of urlBlocks) {
    const loc = extractTag(block, 'loc');
    const lastmod = extractTag(block, 'lastmod');
    const priority = extractTag(block, 'priority');
    const changefreq = extractTag(block, 'changefreq');

    if (loc) {
      results.push({
        loc,
        lastmod: lastmod ? new Date(lastmod).toISOString() : null,
        priority: priority ? parseFloat(priority) : null,
        changefreq,
      });
    }
  }

  return results;
}

/**
 * Parse de sitemapindex (extrai URLs de sub-sitemaps)
 */
function parseSitemapIndex(xml: string): string[] {
  const locs: string[] = [];
  const sitemapBlocks = xml.match(/<sitemap\b[\s\S]*?<\/sitemap>/gi) || [];

  for (const block of sitemapBlocks) {
    const loc = extractTag(block, 'loc');
    if (loc) locs.push(loc);
  }

  return locs;
}

/**
 * Busca XML do sitemap (suporta .xml e .xml.gz)
 */
async function fetchSitemapXML(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (url.endsWith('.gz') || contentType.includes('gzip')) {
    // Suporte a gzip pode ser adicionado aqui se necessário
    // Por enquanto, retornar texto
    return await response.text();
  }

  return await response.text();
}

/**
 * Insere URLs em lotes
 */
async function insertUrlsBatch(supabase: any, urls: any[]): Promise<void> {
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
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }

    console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} URLs)`);
  }
}

/**
 * Processa um sitemap recursivamente
 */
async function processSitemap(
  supabase: any,
  siteId: string,
  sitemapUrl: string,
  sitemapId: string | null,
  parentSitemapId: string | null = null
): Promise<{ sitemaps_processed: number; urls_inserted: number }> {
  console.log(`📄 Processing sitemap: ${sitemapUrl}`);

  let sitemapsProcessed = 0;
  let urlsInserted = 0;

  try {
    const xml = await fetchSitemapXML(sitemapUrl);
    const type = detectSitemapType(xml);

    console.log(`📋 Sitemap type: ${type}`);

    if (type === 'sitemapindex') {
      // Processar sitemaps filhos recursivamente
      const childSitemaps = parseSitemapIndex(xml);
      console.log(`🔗 Found ${childSitemaps.length} child sitemaps`);

      for (const childUrl of childSitemaps) {
        const result = await processSitemap(supabase, siteId, childUrl, null, sitemapId);
        sitemapsProcessed += result.sitemaps_processed;
        urlsInserted += result.urls_inserted;
      }

      sitemapsProcessed += 1;
    } else {
      // Extrair URLs individuais
      const urls = parseUrlset(xml);
      console.log(`🎯 Found ${urls.length} URLs`);

      if (urls.length > 0) {
        const urlsToInsert = urls.map((u) => ({
          site_id: siteId,
          integration_id: null,
          url: u.loc,
          discovered_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          current_status: 'discovered',
          gsc_data: false,
          indexnow_data: false,
        }));

        await insertUrlsBatch(supabase, urlsToInsert);
        urlsInserted += urls.length;
      }

      sitemapsProcessed += 1;
    }

    // Atualizar sitemap submission
    if (sitemapId) {
      const updateData: any = {
        sitemap_type: type,
        updated_at: new Date().toISOString(),
      };
      
      // SOMENTE atualizar page_count se for 'urlset' (não sitemap index)
      if (type === 'urlset') {
        updateData.page_count = urlsInserted;
      }
      
      await supabase
        .from('gsc_sitemap_submissions')
        .update(updateData)
        .eq('id', sitemapId);
    }

    return { sitemaps_processed: sitemapsProcessed, urls_inserted: urlsInserted };
  } catch (error) {
    console.error(`❌ Error processing sitemap ${sitemapUrl}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('📄 GSC Sitemaps Process - Request received');

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

    const { site_id, sitemap_ids } = await req.json();

    if (!site_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: site_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Processing sitemaps for site ${site_id}`);
    if (sitemap_ids && sitemap_ids.length > 0) {
      console.log(`📋 Filtering by sitemap IDs: ${sitemap_ids.join(', ')}`);
    }

    // Buscar sitemaps do projeto
    let sitemapQuery = supabase
      .from('gsc_sitemap_submissions')
      .select('*')
      .eq('site_id', site_id);

    // Filter by specific sitemap_ids if provided
    if (sitemap_ids && sitemap_ids.length > 0) {
      sitemapQuery = sitemapQuery.in('id', sitemap_ids);
    }

    const { data: sitemaps, error: sitemapsError } = await sitemapQuery;

    if (sitemapsError) {
      throw sitemapsError;
    }

    if (!sitemaps || sitemaps.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: sitemap_ids?.length > 0 
            ? 'No matching sitemaps found' 
            : 'No sitemaps found for this site',
          sitemaps_processed: 0,
          total_urls_discovered: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${sitemaps.length} sitemaps to process`);

    let totalSitemapsProcessed = 0;
    const allUniqueUrls = new Set<string>();
    const failedSitemaps: Array<{ url: string; error: string }> = [];

    // FASE 1: Coletar todas as URLs de todos os sitemaps (com deduplicação)
    console.log('🔄 FASE 1: Coletando URLs de todos os sitemaps...');
    
    for (const sitemap of sitemaps) {
      try {
        const xml = await fetchSitemapXML(sitemap.sitemap_url);
        const type = detectSitemapType(xml);

        if (type === 'urlset') {
          const urls = parseUrlset(xml);
          urls.forEach(u => allUniqueUrls.add(u.loc));
          console.log(`✅ ${sitemap.sitemap_url}: ${urls.length} URLs coletadas`);
        } else {
          // Se for index, processar recursivamente os filhos
          const childSitemaps = parseSitemapIndex(xml);
          for (const childUrl of childSitemaps) {
            try {
              const childXml = await fetchSitemapXML(childUrl);
              const childUrls = parseUrlset(childXml);
              childUrls.forEach(u => allUniqueUrls.add(u.loc));
              console.log(`✅ ${childUrl}: ${childUrls.length} URLs coletadas`);
            } catch (childError) {
              console.warn(`⚠️  Erro ao processar child sitemap ${childUrl}:`, childError);
            }
          }
        }
        
        totalSitemapsProcessed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing sitemap ${sitemap.sitemap_url}:`, errorMessage);
        failedSitemaps.push({
          url: sitemap.sitemap_url,
          error: errorMessage
        });
      }
    }

    console.log(`🎯 Total de URLs únicas coletadas: ${allUniqueUrls.size}`);

    // FASE 2: Inserir URLs únicas no banco
    console.log('💾 FASE 2: Inserindo URLs únicas no banco...');
    
    const urlsToInsert = Array.from(allUniqueUrls).map(url => ({
      site_id: site_id,
      integration_id: null,
      url: url,
      discovered_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      current_status: 'discovered',
      gsc_data: false,
      indexnow_data: false,
    }));

    await insertUrlsBatch(supabase, urlsToInsert);

    const duration = Date.now() - startTime;
    console.log(`✅ Processing completed in ${duration}ms`);
    
    if (failedSitemaps.length > 0) {
      console.log(`⚠️  ${failedSitemaps.length} sitemap(s) failed to process`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sitemaps_processed: totalSitemapsProcessed,
        urls_inserted: allUniqueUrls.size,
        duration_ms: duration,
        failed_sitemaps: failedSitemaps.length > 0 ? failedSitemaps : undefined,
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
