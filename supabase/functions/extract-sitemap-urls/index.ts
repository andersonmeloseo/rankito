import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapRequest {
  sitemap_urls: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Extract Sitemap URLs - Request received");
    
    const { sitemap_urls }: SitemapRequest = await req.json();
    
    if (!sitemap_urls || sitemap_urls.length === 0) {
      throw new Error("Nenhuma URL de sitemap fornecida");
    }
    
    console.log(`📋 Processando ${sitemap_urls.length} sitemaps...`);
    
    const allUrls: string[] = [];
    
    for (const sitemapUrl of sitemap_urls) {
      try {
        console.log(`🔍 Buscando sitemap: ${sitemapUrl}`);
        const response = await fetch(sitemapUrl);
        const xmlText = await response.text();
        
        // Extrair URLs do XML usando regex
        const urlMatches = xmlText.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g);
        const extractedUrls: string[] = [];
        
        for (const match of urlMatches) {
          extractedUrls.push(match[1].trim());
        }
        
        console.log(`✅ Extraídas ${extractedUrls.length} URLs de ${sitemapUrl}`);
        allUrls.push(...extractedUrls);
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${sitemapUrl}:`, error);
      }
    }
    
    // Remover duplicatas
    const uniqueUrls = [...new Set(allUrls)];
    const duplicatesRemoved = allUrls.length - uniqueUrls.length;
    
    console.log(`✅ Total de URLs únicas extraídas: ${uniqueUrls.length}`);
    if (duplicatesRemoved > 0) {
      console.log(`🔄 ${duplicatesRemoved} URLs duplicadas removidas`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        urls: uniqueUrls,
        total: uniqueUrls.length,
        duplicates_removed: duplicatesRemoved
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
    
  } catch (error) {
    console.error("❌ Erro ao extrair URLs:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
