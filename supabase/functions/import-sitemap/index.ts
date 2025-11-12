import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process a single sitemap or sitemap index recursively with limits using regex
async function processSitemap(
  sitemapUrl: string, 
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
    
    // Usar regex para extrair URLs - detectar tipo de sitemap
    const isSitemapIndex = xml.includes('<sitemapindex');
    
    if (isSitemapIndex) {
      // Extrair URLs de child sitemaps
      const sitemapRegex = /<loc>\s*([^<]+)\s*<\/loc>/g;
      const allSitemaps: string[] = [];
      let match;
      
      while ((match = sitemapRegex.exec(xml)) !== null) {
        allSitemaps.push(match[1].trim());
      }
      
      const limitedSitemaps = allSitemaps.slice(sitemapOffset, sitemapOffset + maxSitemaps);
      
      console.log(`Found sitemap index with ${allSitemaps.length} child sitemaps, processing ${limitedSitemaps.length} (offset: ${sitemapOffset})`);
      
      // Store total sitemaps count for response
      const allUrls: string[] = [];
      (allUrls as any).totalSitemapsFound = allSitemaps.length;
      (allUrls as any).sitemapsProcessed = limitedSitemaps.length;
      
      // Process all sitemaps in parallel
      const sitemapPromises = limitedSitemaps.map(async (childSitemapUrl) => {
        return await processSitemap(childSitemapUrl, depth + 1, maxSitemaps, 0);
      });

      const results = await Promise.all(sitemapPromises);
      allUrls.push(...results.flat());
      
      console.log(`Sitemap index processed: ${allUrls.length} URLs found from ${limitedSitemaps.length} sitemaps`);
      return allUrls;
    } else {
      // Regular sitemap - extrair URLs de páginas
      const urlRegex = /<loc>\s*([^<]+)\s*<\/loc>/g;
      const urls: string[] = [];
      let match;
      
      while ((match = urlRegex.exec(xml)) !== null) {
        urls.push(match[1].trim());
      }
      
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
      max_sitemaps = 20,
      sitemap_offset = 0,
      is_final_batch = false,
      import_job_id = null,
      user_id = null
    } = await req.json();

    if (!site_id || !sitemap_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, sitemap_url' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Importing sitemap from:', sitemap_url, 'for site:', site_id);
    console.log('Processing with limits:', { max_urls, batch_size, max_sitemaps, sitemap_offset });

    // Process sitemap with limits using regex
    const urls = await processSitemap(sitemap_url, 0, max_sitemaps, sitemap_offset);
    
    // Extract sitemap statistics
    const totalSitemapsFound = (urls as any).totalSitemapsFound || 1;
    const sitemapsProcessed = (urls as any).sitemapsProcessed || 1;

    // Aplicar limite de URLs
    const limitedUrls = urls.slice(0, max_urls);
    
    // Safety limit to prevent CPU timeout during database operations
    const SAFE_URL_LIMIT = 10000; // Aumentado de 5000 para reduzir número de lotes
    const safeUrls = limitedUrls.slice(0, SAFE_URL_LIMIT);
    
    if (limitedUrls.length > SAFE_URL_LIMIT) {
      console.log(`Safety limit applied: ${limitedUrls.length} URLs → ${SAFE_URL_LIMIT} URLs`);
    }
    
    console.log(`Processing ${safeUrls.length} URLs (limit: ${max_urls}, safety: ${SAFE_URL_LIMIT})`);

    // Gerenciar job de importação
    let jobId = import_job_id;
    
    if (!jobId && user_id) {
      // Primeira chamada: criar novo job
      const { data: newJob, error: jobError } = await supabase
        .from('sitemap_import_jobs')
        .insert({
          site_id,
          sitemap_url,
          total_sitemaps_found: totalSitemapsFound,
          sitemaps_processed: 0,
          total_urls_expected: urls.length,
          urls_imported: 0,
          created_by_user_id: user_id
        })
        .select('id')
        .single();
      
      if (newJob) {
        jobId = newJob.id;
        console.log(`Created import job ${jobId}`);
      }
      if (jobError) console.error('Error creating job:', jobError);
    }

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

    for (const pageUrl of safeUrls) {
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
    console.log(`Deduplicated: ${safeUrls.length} URLs -> ${pagesToUpsert.length} unique URLs`);
    
    // Separar páginas novas de páginas existentes
    const pagesToInsert = pagesToUpsert.filter(p => !p.id);
    const pagesToUpdate = pagesToUpsert.filter(p => p.id);
    
    console.log(`Existing pages in DB: ${existingPagesMap.size}`);
    console.log(`New pages to insert: ${pagesToInsert.length}`);
    console.log(`Existing pages to update: ${pagesToUpdate.length}`);

    // 1. INSERT de páginas novas (sem campo id, deixa banco gerar)
    if (pagesToInsert.length > 0) {
      console.log(`Inserting ${pagesToInsert.length} new pages in batches of ${batch_size}`);
      for (let i = 0; i < pagesToInsert.length; i += batch_size) {
        const batch = pagesToInsert.slice(i, i + batch_size);
        
        // Remover campo id completamente dos objetos novos
        const cleanBatch = batch.map(({ id, ...rest }) => rest);
        
        const { error, data } = await supabase
          .from('rank_rent_pages')
          .insert(cleanBatch)
          .select('id');
        
        if (error) {
          console.error('Batch insert error:', error);
          errors += batch.length;
        } else {
          newPages += data?.length || 0;
        }
      }
    }

    // 2. UPDATE de páginas existentes (com id)
    if (pagesToUpdate.length > 0) {
      console.log(`Updating ${pagesToUpdate.length} existing pages in batches of ${batch_size}`);
      for (let i = 0; i < pagesToUpdate.length; i += batch_size) {
        const batch = pagesToUpdate.slice(i, i + batch_size);
        
        const { error } = await supabase
          .from('rank_rent_pages')
          .upsert(batch, {
            onConflict: 'site_id,page_url',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('Batch update error:', error);
          errors += batch.length;
        } else {
          updatedPages += batch.length;
        }
      }
    }

    // Atualizar progresso do job
    if (jobId) {
      const totalProcessedSoFar = sitemap_offset + sitemapsProcessed;
      const isJobComplete = totalProcessedSoFar >= totalSitemapsFound;
      
      const { count } = await supabase
        .from('rank_rent_pages')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site_id);
      
      await supabase
        .from('sitemap_import_jobs')
        .update({
          sitemaps_processed: totalProcessedSoFar,
          urls_imported: count || 0,
          is_complete: isJobComplete,
          completed_at: isJobComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      console.log(`Job progress: ${totalProcessedSoFar}/${totalSitemapsFound} sitemaps, complete: ${isJobComplete}`);
    }

    // Desativação inteligente: só desativa se job está 100% completo
    let deactivatedCount = 0;
    
    if (jobId) {
      // Verificar se job está realmente completo
      const { data: job } = await supabase
        .from('sitemap_import_jobs')
        .select('is_complete, total_sitemaps_found, sitemaps_processed, started_at')
        .eq('id', jobId)
        .single();
      
      // Só desativa se job está 100% completo
      if (job?.is_complete && job.sitemaps_processed >= job.total_sitemaps_found) {
        console.log('Job 100% completo. Iniciando desativação de páginas não encontradas...');
        
        // Buscar TODAS as páginas do site
        const { data: allSitePages } = await supabase
          .from('rank_rent_pages')
          .select('id, page_url')
          .eq('site_id', site_id);
        
        // Buscar TODAS as URLs que foram importadas durante este job
        const { data: allImportedUrls } = await supabase
          .from('rank_rent_pages')
          .select('page_url')
          .eq('site_id', site_id)
          .gte('last_scraped_at', job.started_at);
        
        const importedUrlsSet = new Set((allImportedUrls || []).map(p => p.page_url));
        
        const pagesToDeactivate = (allSitePages || [])
          .filter(p => !importedUrlsSet.has(p.page_url))
          .map(p => p.id);
        
        if (pagesToDeactivate.length > 0) {
          const { error: deactivateError } = await supabase
            .from('rank_rent_pages')
            .update({ status: 'inactive' })
            .in('id', pagesToDeactivate);
          
          if (!deactivateError) {
            deactivatedCount = pagesToDeactivate.length;
            console.log(`${deactivatedCount} páginas desativadas (não encontradas no sitemap)`);
          }
        }
      } else {
        console.log(`Job ainda não completo. Desativação pulada. (${job?.sitemaps_processed}/${job?.total_sitemaps_found} sitemaps processados)`);
      }
    }

    console.log('Import complete:', { newPages, updatedPages, errors, deactivated: deactivatedCount });

    return new Response(
      JSON.stringify({
        success: true,
        import_job_id: jobId,
        totalSitemapsFound,
        sitemapsProcessed,
        totalUrlsFound: urls.length,
        urlsImported: safeUrls.length,
        newPages,
        updatedPages,
        deactivatedPages: deactivatedCount,
        limited: urls.length > max_urls || safeUrls.length < limitedUrls.length,
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