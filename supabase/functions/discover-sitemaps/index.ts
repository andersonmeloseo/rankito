import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredSitemap {
  url: string;
  name: string;
  urlCount: number;
}

async function countUrlsInSitemap(sitemapUrl: string): Promise<number> {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) return 0;
    
    const xmlText = await response.text();
    const urlMatches = xmlText.match(/<loc>\s*([^<]+)\s*<\/loc>/g);
    
    return urlMatches ? urlMatches.length : 0;
  } catch (error) {
    console.error(`Error counting URLs in ${sitemapUrl}:`, error);
    return 0;
  }
}

function extractSitemapName(url: string): string {
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1] || 'sitemap';
  return filename.replace('.xml', '').replace(/-sitemap$/, '').replace(/_/g, ' ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sitemap_url, site_id, user_id } = await req.json();

    if (!sitemap_url || !site_id || !user_id) {
      throw new Error('Missing required parameters');
    }

    console.log('Discovering sitemaps from:', sitemap_url);

    // Fetch the sitemap index
    const response = await fetch(sitemap_url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('SITEMAP_NOT_FOUND: O sitemap não foi encontrado na URL fornecida. Verifique se a URL está correta e acessível.');
      } else if (response.status === 403) {
        throw new Error('SITEMAP_FORBIDDEN: Acesso negado ao sitemap. Verifique as permissões do site.');
      } else if (response.status >= 500) {
        throw new Error('SITEMAP_SERVER_ERROR: O servidor do sitemap está com problemas. Tente novamente mais tarde.');
      } else {
        throw new Error(`SITEMAP_FETCH_FAILED: Não foi possível acessar o sitemap (código ${response.status}). Verifique a URL e tente novamente.`);
      }
    }

    const xmlText = await response.text();

    // Check if it's a sitemap index
    const isSitemapIndex = xmlText.includes('<sitemapindex');

    if (!isSitemapIndex) {
      // It's a regular sitemap, count URLs directly
      const urlCount = await countUrlsInSitemap(sitemap_url);
      
      return new Response(
        JSON.stringify({
          sitemaps: [{
            url: sitemap_url,
            name: extractSitemapName(sitemap_url),
            urlCount
          }],
          totalUrls: urlCount,
          totalSitemaps: 1,
          isSitemapIndex: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract all sitemap URLs from the index
    const sitemapMatches = xmlText.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g);
    const sitemapUrls = Array.from(sitemapMatches).map(match => match[1].trim());

    console.log(`Found ${sitemapUrls.length} sitemaps in index`);

    // Count URLs in each sitemap and collect ALL unique URLs
    const discoveredSitemaps: DiscoveredSitemap[] = [];
    const allUniqueUrls = new Set<string>();

    for (const sitemapUrl of sitemapUrls) {
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch ${sitemapUrl}: ${response.status}`);
        continue;
      }
      
      const sitemapXml = await response.text();
      const urlMatches = sitemapXml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g);
      const urls = Array.from(urlMatches).map(match => match[1].trim());
      
      // Add to unique URLs set
      urls.forEach(url => allUniqueUrls.add(url));
      
      const name = extractSitemapName(sitemapUrl);
      const urlCount = urls.length;
      
      discoveredSitemaps.push({
        url: sitemapUrl,
        name,
        urlCount
      });
      
      console.log(`Sitemap ${name}: ${urlCount} URLs`);
    }

    // Calculate REAL total after deduplication
    const totalUrls = allUniqueUrls.size;
    const totalIndividual = discoveredSitemaps.reduce((sum, s) => sum + s.urlCount, 0);
    const duplicateCount = totalIndividual - totalUrls;

    console.log(`✅ Total unique URLs: ${totalUrls} (${duplicateCount} duplicates removed)`);

    // Sort by URL count descending
    discoveredSitemaps.sort((a, b) => b.urlCount - a.urlCount);

    return new Response(
      JSON.stringify({
        sitemaps: discoveredSitemaps,
        totalUrls,
        totalSitemaps: discoveredSitemaps.length,
        isSitemapIndex: true,
        duplicateCount,
        totalIndividual
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error discovering sitemaps:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Extrair tipo de erro se houver prefixo
    const errorType = errorMessage.split(':')[0];
    const errorDetails = errorMessage.includes(':') ? errorMessage.split(':').slice(1).join(':').trim() : errorMessage;
    
    return new Response(
      JSON.stringify({ 
        error: errorType,
        message: errorDetails,
        action: 'Verifique a URL do sitemap e tente novamente'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
