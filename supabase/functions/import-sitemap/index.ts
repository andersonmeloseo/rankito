import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch sitemap XML
    const sitemapResponse = await fetch(sitemap_url);
    if (!sitemapResponse.ok) {
      throw new Error(`Failed to fetch sitemap: ${sitemapResponse.statusText}`);
    }

    const sitemapXml = await sitemapResponse.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(sitemapXml, "text/xml");
    
    if (!doc) {
      throw new Error('Failed to parse sitemap XML');
    }

    // Extract all URLs from sitemap
    const urlElements = doc.querySelectorAll('url > loc');
    const urls = Array.from(urlElements).map((el) => el.textContent?.trim()).filter(Boolean);

    console.log(`Found ${urls.length} URLs in sitemap`);

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