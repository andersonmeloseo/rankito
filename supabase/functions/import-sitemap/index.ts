import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process a single sitemap or sitemap index recursively
async function processSitemap(
  sitemapUrl: string, 
  parser: DOMParser,
  depth: number = 0
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
    const doc = parser.parseFromString(xml, "text/html"); // Use text/html for better compatibility
    
    if (!doc) {
      console.error(`Failed to parse sitemap: ${sitemapUrl}`);
      return [];
    }

    // Check if it's a sitemap index
    const sitemapElements = doc.querySelectorAll('sitemapindex > sitemap > loc, sitemapindex sitemap loc');
    
    if (sitemapElements.length > 0) {
      // It's a sitemap index - process each child sitemap
      console.log(`Found sitemap index with ${sitemapElements.length} child sitemaps`);
      const allUrls: string[] = [];
      
      for (const sitemapEl of Array.from(sitemapElements)) {
        const childSitemapUrl = sitemapEl.textContent?.trim();
        if (childSitemapUrl) {
          const childUrls = await processSitemap(childSitemapUrl, parser, depth + 1);
          allUrls.push(...childUrls);
        }
      }
      
      console.log(`Sitemap index processed: ${allUrls.length} total URLs found`);
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

    const { site_id, sitemap_url } = await req.json();

    if (!site_id || !sitemap_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: site_id, sitemap_url' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Importing sitemap from:', sitemap_url, 'for site:', site_id);

    // Process sitemap (handles both regular sitemaps and sitemap indexes)
    const parser = new DOMParser();
    const urls = await processSitemap(sitemap_url, parser);

    console.log(`Total URLs found: ${urls.length}`);

    let newPages = 0;
    let updatedPages = 0;
    let errors = 0;

    // Process each URL
    for (const pageUrl of urls) {
      try {
        if (!pageUrl) continue;

        const url = new URL(pageUrl);
        const pagePath = url.pathname;

        // Check if page already exists
        const { data: existingPage } = await supabase
          .from('rank_rent_pages')
          .select('id, page_title, phone_number')
          .eq('page_url', pageUrl)
          .maybeSingle();

        // Fetch page content to extract title and phone
        let pageTitle = existingPage?.page_title || null;
        let phoneNumber = existingPage?.phone_number || null;

        // Only fetch if we don't have title or phone yet
        if (!pageTitle || !phoneNumber) {
          try {
            const pageResponse = await fetch(pageUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 RankRentBot/1.0' }
            });
            
            if (pageResponse.ok) {
              const html = await pageResponse.text();
              const pageDoc = parser.parseFromString(html, "text/html");
              
              if (pageDoc) {
                // Extract title
                const titleEl = pageDoc.querySelector('title');
                if (titleEl && !pageTitle) {
                  pageTitle = titleEl.textContent?.trim() || null;
                }

                // Extract phone number using regex
                if (!phoneNumber) {
                  const bodyText = pageDoc.body?.textContent || '';
                  const phoneRegex = /(\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4})/g;
                  const matches = bodyText.match(phoneRegex);
                  phoneNumber = matches ? matches[0] : null;
                }
              }
            }
          } catch (fetchError) {
            console.error(`Error fetching page ${pageUrl}:`, fetchError);
          }
        }

        if (existingPage) {
          // Update existing page
          const { error } = await supabase
            .from('rank_rent_pages')
            .update({
              page_title: pageTitle,
              phone_number: phoneNumber,
              last_scraped_at: new Date().toISOString(),
              status: 'active'
            })
            .eq('id', existingPage.id);

          if (error) throw error;
          updatedPages++;
        } else {
          // Insert new page
          const { error } = await supabase
            .from('rank_rent_pages')
            .insert({
              site_id,
              page_url: pageUrl,
              page_path: pagePath,
              page_title: pageTitle,
              phone_number: phoneNumber,
              last_scraped_at: new Date().toISOString(),
              status: 'active'
            });

          if (error) throw error;
          newPages++;
        }
      } catch (pageError) {
        console.error(`Error processing ${pageUrl}:`, pageError);
        errors++;
      }
    }

    // Mark pages not in sitemap as inactive
    const { data: allPages } = await supabase
      .from('rank_rent_pages')
      .select('id, page_url')
      .eq('site_id', site_id);

    if (allPages) {
      const sitemapUrls = new Set(urls);
      const pagesToDeactivate = allPages.filter(p => !sitemapUrls.has(p.page_url));
      
      if (pagesToDeactivate.length > 0) {
        await supabase
          .from('rank_rent_pages')
          .update({ status: 'inactive' })
          .in('id', pagesToDeactivate.map(p => p.id));
      }
    }

    console.log('Import complete:', { newPages, updatedPages, errors });

    return new Response(
      JSON.stringify({
        success: true,
        newPages,
        updatedPages,
        deactivatedPages: allPages?.length ? allPages.length - urls.length : 0,
        totalUrls: urls.length,
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