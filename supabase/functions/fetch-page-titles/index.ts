import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { page_ids } = await req.json();
    
    if (!page_ids || !Array.isArray(page_ids)) {
      throw new Error("page_ids é obrigatório e deve ser um array");
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`Buscando títulos para ${page_ids.length} páginas`);

    // Buscar páginas sem título
    const { data: pages, error } = await supabase
      .from('rank_rent_pages')
      .select('id, page_url, page_title')
      .in('id', page_ids)
      .or('page_title.is.null,page_title.eq.')
      .limit(50); // Limitar para evitar timeout

    if (error) throw error;

    console.log(`Encontradas ${pages.length} páginas sem título`);

    const updates = [];

    // Buscar meta title de cada URL
    for (const page of pages) {
      try {
        console.log(`Buscando título para: ${page.page_url}`);
        
        const response = await fetch(page.page_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MetaTitleFetcher/1.0)',
          },
          signal: AbortSignal.timeout(10000), // 10s timeout por página
        });

        if (response.ok) {
          const html = await response.text();
          
          // Extrair meta title (priorizar og:title, depois <title>)
          const metaTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          
          const title = metaTitleMatch?.[1] || titleMatch?.[1] || null;
          
          if (title) {
            const cleanTitle = title.trim().substring(0, 255);
            console.log(`Título encontrado: ${cleanTitle}`);
            updates.push({
              id: page.id,
              title: cleanTitle,
            });
          } else {
            console.log(`Nenhum título encontrado para: ${page.page_url}`);
          }
        } else {
          console.log(`Erro HTTP ${response.status} para: ${page.page_url}`);
        }
      } catch (err) {
        console.error(`Erro ao buscar título de ${page.page_url}:`, err);
      }
    }

    console.log(`Atualizando ${updates.length} páginas com novos títulos`);

    // Atualizar no banco
    for (const update of updates) {
      await supabase
        .from('rank_rent_pages')
        .update({ page_title: update.title })
        .eq('id', update.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pages.length,
        updated: updates.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
