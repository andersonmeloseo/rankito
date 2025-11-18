import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
      
      // Process sitemaps in batches of 10 to avoid timeout
      const BATCH_SIZE = 10;
      
      for (let i = 0; i < limitedSitemaps.length; i += BATCH_SIZE) {
        const batch = limitedSitemaps.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing sitemap batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(limitedSitemaps.length/BATCH_SIZE)}: ${batch.length} sitemaps`);
        
        const batchPromises = batch.map(async (childSitemapUrl) => {
          // Retry logic: 3 tentativas com backoff exponencial
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const urls = await processSitemap(childSitemapUrl, depth + 1, maxSitemaps, 0);
              console.log(`  ✅ ${childSitemapUrl}: ${urls.length} URLs`);
              return urls;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              console.error(`  ⚠️ Attempt ${attempt}/3 failed for ${childSitemapUrl}:`, errorMsg);
              if (attempt === 3) {
                console.error(`  ❌ Failed permanently: ${childSitemapUrl}`);
                return [];
              }
              // Backoff exponencial: 1s, 2s, 4s
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
            }
          }
          return [];
        });

        const batchResults = await Promise.all(batchPromises);
        allUrls.push(...batchResults.flat());
        
        console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} completed. Total URLs so far: ${allUrls.length}`);
      }
      
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
      max_sitemaps = 100, // Aumentado de 30 para 100
      sitemap_offset = 0,
      is_final_batch = false,
      import_job_id = null,
      user_id = null,
      selected_sitemaps = null // NEW: Array of specific sitemap URLs to import
    } = await req.json();

    if (!site_id || !sitemap_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, sitemap_url' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Importing sitemap from:', sitemap_url, 'for site:', site_id);
    console.log('Processing with limits:', { max_urls, batch_size, max_sitemaps, sitemap_offset });

    let urls: string[];
    
    // If specific sitemaps are selected, process only those
    if (selected_sitemaps && selected_sitemaps.length > 0) {
      console.log(`Processing ${selected_sitemaps.length} selected sitemaps`);
      urls = [];
      
      for (const selectedSitemapUrl of selected_sitemaps) {
        console.log(`Processing selected sitemap: ${selectedSitemapUrl}`);
        const sitemapUrls = await processSitemap(selectedSitemapUrl, 0, 1, 0);
        urls.push(...sitemapUrls);
      }
      
      console.log(`Total URLs from selected sitemaps: ${urls.length}`);
    } else {
      // Process sitemap recursively (normal flow)
      urls = await processSitemap(sitemap_url, 0, max_sitemaps, sitemap_offset);
    }
    
    // ✅ CORREÇÃO 1: Capturar URLs ANTES de qualquer limite
    const allRawUrlsBeforeLimits = [...urls];
    console.log(`📊 TOTAL de URLs encontradas no sitemap: ${allRawUrlsBeforeLimits.length}`);
    
    // Extract sitemap statistics
    const totalSitemapsFound = (urls as any).totalSitemapsFound || 1;
    const sitemapsProcessed = (urls as any).sitemapsProcessed || 1;

    // ✅ CORREÇÃO 2: Remover limite max_urls oculto - processar TODAS as URLs
    const limitedUrls = urls; // Sem limite artificial
    
    // Safety limit to prevent CPU timeout during database operations
    const SAFE_URL_LIMIT = 100000;
    const safeUrls = limitedUrls.slice(0, SAFE_URL_LIMIT);
    
    if (limitedUrls.length > SAFE_URL_LIMIT) {
      console.warn(`⚠️ SAFETY LIMIT REACHED: ${limitedUrls.length} URLs found, but processing only ${SAFE_URL_LIMIT}`);
      console.warn(`⚠️ ${limitedUrls.length - SAFE_URL_LIMIT} URLs will be IGNORED for safety!`);
    }
    
    console.log(`Processing ${safeUrls.length} URLs (safety limit: ${SAFE_URL_LIMIT})`);

    // ============= BUSCAR LIMITE DO PLANO =============
    console.log(`🔍 Verificando limite do plano para user_id: ${user_id}`);

    const { data: userSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        plan_id,
        subscription_plans (
          name,
          max_pages_per_site
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError) {
      console.error('❌ Erro ao buscar plano:', subError);
    }

    const planName = userSubscription?.subscription_plans?.[0]?.name || 'Desconhecido';
    const maxPages = userSubscription?.subscription_plans?.[0]?.max_pages_per_site;
    const isUnlimited = maxPages === null;

    console.log(`📊 Plano: ${planName} | Limite: ${isUnlimited ? '∞ ILIMITADO' : maxPages}`);

    // CONTAR PÁGINAS ATUAIS DO SITE
    const { count: currentPages, error: countError } = await supabase
      .from('rank_rent_pages')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', site_id);

    if (countError) {
      console.error('❌ Erro ao contar páginas:', countError);
    }

    const currentCount = currentPages || 0;
    console.log(`📄 Páginas atuais no site: ${currentCount}`);

    // CALCULAR ESPAÇO DISPONÍVEL
    let spaceAvailable = Infinity;
    let limitReached = false;
    let pagesBlocked = 0;

    if (!isUnlimited) {
      spaceAvailable = maxPages! - currentCount;
      limitReached = spaceAvailable <= 0;
      
      console.log(`📦 Espaço disponível: ${spaceAvailable} páginas`);
      
      if (limitReached) {
        console.error(`🚫 LIMITE ATINGIDO! ${currentCount}/${maxPages} páginas`);
        
        return new Response(JSON.stringify({
          success: false,
          limitReached: true,
          planName,
          maxPages,
          currentPages: currentCount,
          spaceAvailable: 0,
          pagesBlocked: safeUrls.length,
          message: `Limite de ${maxPages} páginas atingido. Seu site já tem ${currentCount} páginas cadastradas. Faça upgrade para o plano Enterprise e tenha páginas ilimitadas!`
        }), { status: 400, headers: corsHeaders });
      }
    }

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
    const failedUrls: Array<{ url: string; error: string }> = []; // ✅ Rastrear URLs com erro

    // Buscar apenas IDs e URLs das páginas existentes (otimizado)
    const { data: existingPages } = await supabase
      .from('rank_rent_pages')
      .select('page_url, id')
      .eq('site_id', site_id);

    const existingPagesMap = new Map(
      (existingPages || []).map(p => [p.page_url, p])
    );

    // Capturar TODAS as URLs brutas antes de deduplicação
    const allRawUrls = [...safeUrls];
    
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
        // ✅ CORREÇÃO 3: Logging detalhado de erros
        const errorMsg = pageError instanceof Error ? pageError.message : String(pageError);
        console.error(`❌ ERRO ao processar URL: ${pageUrl}`);
        console.error(`   Motivo: ${errorMsg}`);
        errors++;
        failedUrls.push({ url: pageUrl, error: errorMsg });
      }
    }

    // Converter Map para array (apenas URLs únicas)
    const pagesToUpsert = Array.from(pagesMap.values());
    console.log(`Deduplicated: ${safeUrls.length} URLs -> ${pagesToUpsert.length} unique URLs`);
    
    // Identificar quais URLs foram removidas como duplicadas
    const uniqueUrlsSet = new Set(pagesToUpsert.map(p => p.page_url));
    const duplicateUrls: string[] = [];
    const seenUrls = new Set<string>();
    
    for (const url of allRawUrls) {
      if (seenUrls.has(url)) {
        // Esta é uma duplicata
        duplicateUrls.push(url);
      } else {
        seenUrls.add(url);
      }
    }
    
    console.log(`Found ${duplicateUrls.length} duplicate URLs`);

    // ============= LIMITAR PÁGINAS AO ESPAÇO DISPONÍVEL =============
    let pagesToImport = pagesToUpsert;

    if (!isUnlimited && spaceAvailable < pagesToUpsert.length) {
      pagesToImport = pagesToUpsert.slice(0, Math.max(0, spaceAvailable));
      pagesBlocked = pagesToUpsert.length - pagesToImport.length;
      
      console.log(`⚠️ LIMITANDO IMPORT: ${pagesToImport.length}/${pagesToUpsert.length} páginas`);
      console.log(`🚫 ${pagesBlocked} páginas bloqueadas pelo limite do plano`);
    }

    // Processar TODAS as páginas com UPSERT (não separa INSERT/UPDATE)
    console.log(`Upserting ${pagesToImport.length} pages in batches of ${batch_size}`);
    const failedBatches: any[] = []; // ✅ Rastrear batches que falharam

    for (let i = 0; i < pagesToImport.length; i += batch_size) {
      const batch = pagesToImport.slice(i, i + batch_size);
      
      // Remover campo id para deixar o banco decidir (novo ou existente)
      const cleanBatch = batch.map(({ id, ...rest }) => rest);
      
      const { error, data } = await supabase
        .from('rank_rent_pages')
        .upsert(cleanBatch, { 
          onConflict: 'site_id,page_url',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        // ✅ CORREÇÃO 4: Logging detalhado no UPSERT
        console.error(`❌ BATCH UPSERT FALHOU!`);
        console.error(`   Tentando inserir: ${batch.length} URLs`);
        console.error(`   Erro: ${error.message}`);
        console.error(`   Primeira URL do batch: ${batch[0]?.page_url}`);
        batch.forEach((p, idx) => {
          console.error(`     [${idx}] ${p.page_url}`);
          failedUrls.push({ url: p.page_url, error: error.message });
        });
        errors += batch.length;
        failedBatches.push({ batch, error: error.message });
      } else {
        // Todos os upserts bem-sucedidos
        const upsertedCount = data?.length || batch.length;
        
        // Contar quantos já existiam
        const existingCount = batch.filter(p => 
          existingPagesMap.has(p.page_url)
        ).length;
        
        newPages += upsertedCount - existingCount;
        updatedPages += existingCount;
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

    // ✅ CORREÇÃO 5: Response com transparência total
    return new Response(
      JSON.stringify({
        success: true,
        import_job_id: jobId,
        
        // Estatísticas de sitemaps
        totalSitemapsFound,
        sitemapsProcessed,
        
        // ✅ URLs REAIS antes de qualquer processamento
        totalUrlsFoundInSitemap: allRawUrlsBeforeLimits.length,
        
        // URLs após limites de segurança
        urlsAfterSafetyLimit: safeUrls.length,
        urlsDiscardedBySafetyLimit: Math.max(0, allRawUrlsBeforeLimits.length - safeUrls.length),
        
        // URLs únicas após deduplicação
        uniqueUrlsToImport: pagesToUpsert.length,
        duplicatesRemoved: duplicateUrls.length,
        
        // Resultados da importação no banco
        pagesInsertedInDB: newPages,
        pagesUpdatedInDB: updatedPages,
        pagesFailedToInsert: errors,
        deactivatedPages: deactivatedCount,
        
        // Listas para debug
        allRawUrls: allRawUrlsBeforeLimits,
        duplicateUrlsList: duplicateUrls,
        failedUrlsList: failedUrls, // ✅ NOVO: URLs que falharam com motivo
        
        // Compatibilidade com código antigo
        totalUrlsFound: allRawUrlsBeforeLimits.length,
        urlsImported: safeUrls.length,
        uniqueUrls: pagesToUpsert.length,
        newPages,
        updatedPages,
        errors,
        
        // Informações do plano (será preenchido abaixo)
        planInfo: {
          name: planName,
          maxPages: isUnlimited ? null : maxPages,
          currentPages: currentCount + newPages,
          spaceAvailable: isUnlimited ? null : Math.max(0, spaceAvailable - newPages),
          isUnlimited,
          limitReached: pagesBlocked > 0
        },
        pagesBlocked,
        
        // Avisos
        warnings: [
          ...(pagesBlocked > 0 ? [`⚠️ ${pagesBlocked} URLs não foram importadas (limite de ${maxPages} páginas atingido)`] : []),
          ...(errors > 0 ? [`${errors} URLs falharam ao inserir no banco`] : []),
          ...(duplicateUrls.length > 0 ? [`${duplicateUrls.length} URLs duplicadas foram removidas`] : []),
          ...(allRawUrlsBeforeLimits.length > safeUrls.length ? [`${allRawUrlsBeforeLimits.length - safeUrls.length} URLs descartadas pelo limite de segurança`] : [])
        ]
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