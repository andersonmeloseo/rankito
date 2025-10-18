import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process a single sitemap or sitemap index recursively with limits
async function processSitemap(
  sitemapUrl: string, 
  parser: DOMParser,
  depth: number = 0,
  maxSitemaps: number = 10,
  sitemapOffset: number = 0
): Promise<string[]> {
  // Prevent infinite recursion
  if (depth > 2) {
    console.warn(`Max depth reached for: ${sitemapUrl}`);
    return [];
  }

  try {
    console.log(`Fetching sitemap (depth ${depth}): ${sitemapUrl}`);
    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 RankRentBot/1.0' }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${sitemapUrl}: ${response.statusText}`);
      return [];
    }

    const xml = await response.text();
    const doc = parser.parseFromString(xml, "text/html");
    
    if (!doc) {
      console.error(`Failed to parse sitemap: ${sitemapUrl}`);
      return [];
    }

    // Check if it's a sitemap index
    const sitemapElements = doc.querySelectorAll('sitemapindex > sitemap > loc, sitemapindex sitemap loc');
    
    if (sitemapElements.length > 0) {
      // It's a sitemap index - process limited child sitemaps IN PARALLEL
      const allSitemaps = Array.from(sitemapElements);
      const limitedSitemaps = allSitemaps.slice(sitemapOffset, sitemapOffset + maxSitemaps);
      
      console.log(`Found sitemap index with ${allSitemaps.length} child sitemaps, processing ${limitedSitemaps.length} (offset: ${sitemapOffset})`);
      
      // Store total sitemaps count for response
      const allUrls: string[] = [];
      (allUrls as any).totalSitemapsFound = allSitemaps.length;
      (allUrls as any).sitemapsProcessed = limitedSitemaps.length;
      
      // Process all sitemaps in parallel for better performance
      const sitemapPromises = limitedSitemaps.map(async (sitemapEl) => {
        const childSitemapUrl = sitemapEl.textContent?.trim();
        if (childSitemapUrl) {
          return await processSitemap(childSitemapUrl, parser, depth + 1, maxSitemaps, 0);
        }
        return [];
      });

      const results = await Promise.all(sitemapPromises);
      allUrls.push(...results.flat());
      
      console.log(`Sitemap index processed: ${allUrls.length} URLs found from ${limitedSitemaps.length} sitemaps`);
      return allUrls;
    } else {
      // It's a regular sitemap - extract URLs
      const urlElements = doc.querySelectorAll('url > loc, urlset url loc');
      const urls = Array.from(urlElements)
        .map((el) => el.textContent?.trim())
        .filter(Boolean) as string[];
      
      console.log(`Regular sitemap processed: ${urls.length} URLs found`);
      return urls;
    }
  } catch (error) {
    console.error(`Error processing sitemap ${sitemapUrl}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      site_id, 
      sitemap_url,
      max_urls = 50000,
      batch_size = 1000,
      max_sitemaps = 20, // Default: 20 sitemaps per batch
      sitemap_offset = 0,
      is_final_batch = false
    } = await req.json();

    if (!site_id || !sitemap_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, sitemap_url' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Importing sitemap from:', sitemap_url, 'for site:', site_id);
    console.log('Processing with limits:', { max_urls, batch_size, max_sitemaps, sitemap_offset });

    // Process sitemap with limits
    const parser = new DOMParser();
    const urls = await processSitemap(sitemap_url, parser, 0, max_sitemaps, sitemap_offset);
    
    // Extract sitemap statistics
    const totalSitemapsFound = (urls as any).totalSitemapsFound || 1;
    const sitemapsProcessed = (urls as any).sitemapsProcessed || 1;

    // Aplicar limite de URLs
    const limitedUrls = urls.slice(0, max_urls);
    console.log(`Processing ${limitedUrls.length} URLs (limit: ${max_urls})`);

    let newPages = 0;
    let updatedPages = 0;
    let errors = 0;

    // Buscar apenas IDs e URLs das páginas existentes (otimizado)
    const { data: existingPages } = await supabase
      .from('rank_rent_pages')
      .select('page_url, id')
      .eq('site_id', site_id);

    const existingPagesMap = new Map(
      (existingPages || []).map(p => [p.page_url, p])
    );

    // Usar Map para deduplicate URLs (evita erro "cannot affect row a second time")
    const pagesMap = new Map();

    for (const pageUrl of limitedUrls) {
      try {
        if (!pageUrl) continue;

        const url = new URL(pageUrl);
        const pagePath = url.pathname;
        const existingPage = existingPagesMap.get(pageUrl);

        const pageData: any = {
          site_id,
          page_url: pageUrl,
          page_path: pagePath,
          last_scraped_at: new Date().toISOString(),
          status: 'active'
        };

        // Só adiciona ID se página já existe (para update), senão deixa o banco gerar
        if (existingPage) {
          pageData.id = existingPage.id;
        }

        // Usa page_url como chave para evitar duplicatas
        pagesMap.set(pageUrl, pageData);

      } catch (pageError) {
        console.error(`Error processing ${pageUrl}:`, pageError);
        errors++;
      }
    }

    // Converter Map para array (apenas URLs únicas)
    const pagesToUpsert = Array.from(pagesMap.values());
    console.log(`Deduplicated: ${limitedUrls.length} URLs -> ${pagesToUpsert.length} unique URLs`);

    // Processar em batches
    console.log(`Upserting ${pagesToUpsert.length} pages in batches of ${batch_size}`);
    
    for (let i = 0; i < pagesToUpsert.length; i += batch_size) {
      const batch = pagesToUpsert.slice(i, i + batch_size);
      
      const { error, data } = await supabase
        .from('rank_rent_pages')
        .upsert(batch, { 
          onConflict: 'page_url',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        console.error('Batch upsert error:', error);
        errors += batch.length;
      } else {
        // Contar novos vs atualizados
        const batchIds = batch.map(p => p.id).filter(Boolean);
        const isNew = batch.filter(p => !p.id);
        newPages += isNew.length;
        updatedPages += batch.length - isNew.length;
      }
    }

    // Only mark pages as inactive on final batch to avoid premature deactivation
    let deactivatedCount = 0;
    if (is_final_batch) {
      const sitemapUrlsSet = new Set(limitedUrls);
      const pagesToDeactivate = (existingPages || [])
        .filter(p => !sitemapUrlsSet.has(p.page_url))
        .map(p => p.id);
      
      if (pagesToDeactivate.length > 0) {
        await supabase
          .from('rank_rent_pages')
          .update({ status: 'inactive' })
          .in('id', pagesToDeactivate);
        deactivatedCount = pagesToDeactivate.length;
      }
    }

    console.log('Import complete:', { newPages, updatedPages, errors, deactivated: deactivatedCount });

    return new Response(
      JSON.stringify({
        success: true,
        totalSitemapsFound,
        sitemapsProcessed,
        totalUrlsFound: urls.length,
        urlsImported: limitedUrls.length,
        newPages,
        updatedPages,
        deactivatedPages: deactivatedCount,
        limited: urls.length > max_urls,
        errors
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});