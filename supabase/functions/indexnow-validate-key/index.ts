import { createClient } from 'npm:@supabase/supabase-js@2';
import { createErrorResponse } from '../_shared/error-responses.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteId } = await req.json();

    if (!siteId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Site ID é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do site
    console.log('🔍 Buscando dados do site:', siteId);
    const { data: site, error: siteError } = await supabaseAdmin
      .from('rank_rent_sites')
      .select('site_url, indexnow_key')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      console.error('❌ Erro ao buscar site:', siteError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Site não encontrado' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!site.indexnow_key) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Chave IndexNow não configurada para este site' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Normalizar URL (adicionar https:// se não tiver)
    let siteUrl = site.site_url;
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      siteUrl = `https://${siteUrl}`;
    }

    // Remover trailing slash
    siteUrl = siteUrl.replace(/\/$/, '');

    // Construir URL do arquivo da chave
    const keyFileUrl = `${siteUrl}/${site.indexnow_key}.txt`;

    console.log('🔍 Validando chave IndexNow:', {
      siteUrl,
      keyFileUrl,
      expectedKey: site.indexnow_key,
    });

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos

    try {
      // Fazer requisição HTTP para o arquivo da chave
      const response = await fetch(keyFileUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'IndexNow-Validator/1.0',
        },
      });

      clearTimeout(timeout);

      console.log('📡 Resposta HTTP:', {
        status: response.status,
        statusText: response.statusText,
        redirected: response.redirected,
        url: response.url,
      });

      // Verificar se arquivo existe
      if (!response.ok) {
        if (response.status === 404) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Arquivo não encontrado (HTTP 404). Verifique se o arquivo ${site.indexnow_key}.txt foi criado na raiz do site ${siteUrl}`,
              details: {
                url: keyFileUrl,
                expectedKey: site.indexnow_key,
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Erro HTTP ${response.status}: ${response.statusText}`,
            details: {
              url: keyFileUrl,
              expectedKey: site.indexnow_key,
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verificar se foi redirecionado
      if (response.redirected && response.url !== keyFileUrl) {
        console.warn('⚠️ Redirecionamento detectado:', response.url);
      }

      // Ler conteúdo do arquivo
      const content = await response.text();
      
      console.log('📄 Conteúdo recebido:', {
        length: content.length,
        preview: content.substring(0, 100),
        raw: JSON.stringify(content.substring(0, 100)),
      });

      // Limpar conteúdo (remover todos os espaços, quebras de linha, tabs, etc)
      const cleanContent = content.replace(/[\r\n\s\t]/g, '');
      const cleanKey = site.indexnow_key.replace(/[\r\n\s\t]/g, '');

      console.log('🧹 Conteúdo limpo:', {
        cleanContent,
        cleanKey,
        match: cleanContent === cleanKey,
      });

      // Comparar conteúdo
      if (cleanContent === cleanKey) {
        console.log('✅ Chave validada com sucesso!');
        
        // Atualizar status de validação no banco
        const { error: updateError } = await supabaseAdmin
          .from('rank_rent_sites')
          .update({ indexnow_validated: true })
          .eq('id', siteId);
        
        if (updateError) {
          console.error('Error updating indexnow_validated:', updateError);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Chave IndexNow validada com sucesso!',
            details: {
              url: keyFileUrl,
              key: site.indexnow_key,
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.error('❌ Conteúdo não corresponde:', {
          expected: cleanKey,
          received: cleanContent,
          expectedLength: cleanKey.length,
          receivedLength: cleanContent.length,
        });

        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Conteúdo do arquivo não corresponde à chave',
            details: {
              url: keyFileUrl,
              expectedKey: site.indexnow_key,
              receivedContent: content.substring(0, 100),
              hint: 'Verifique se o arquivo contém apenas a chave, sem espaços ou quebras de linha',
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (fetchError) {
      clearTimeout(timeout);
      
      const error = fetchError as Error;
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout ao acessar arquivo');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Timeout: Site não respondeu em 10 segundos',
            details: {
              url: keyFileUrl,
              hint: 'Verifique se o site está acessível',
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.error('❌ Erro de rede:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro de rede: ${error.message}`,
          details: {
            url: keyFileUrl,
            hint: 'Verifique se o site está acessível e não está bloqueando requisições',
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ Erro na validação IndexNow:', error);
    return createErrorResponse(error, 'Erro ao validar chave IndexNow', 500);
  }
});
