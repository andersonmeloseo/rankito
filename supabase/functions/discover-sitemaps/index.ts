import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

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
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
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

    // Count URLs in each sitemap
    const discoveredSitemaps: DiscoveredSitemap[] = [];
    let totalUrls = 0;

    for (const sitemapUrl of sitemapUrls) {
      const urlCount = await countUrlsInSitemap(sitemapUrl);
      const name = extractSitemapName(sitemapUrl);
      
      discoveredSitemaps.push({
        url: sitemapUrl,
        name,
        urlCount
      });
      
      totalUrls += urlCount;
      
      console.log(`Sitemap ${name}: ${urlCount} URLs`);
    }

    // Sort by URL count descending
    discoveredSitemaps.sort((a, b) => b.urlCount - a.urlCount);

    return new Response(
      JSON.stringify({
        sitemaps: discoveredSitemaps,
        totalUrls,
        totalSitemaps: discoveredSitemaps.length,
        isSitemapIndex: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error discovering sitemaps:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
