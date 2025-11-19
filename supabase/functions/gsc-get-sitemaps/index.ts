import { createClient } from 'npm:@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 GSC Get Sitemaps - Request received [v2.0 - body parsing]');
    console.log('📦 Request method:', req.method);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    console.log('📝 Parsing request body...');
    const body = await req.json();
    console.log('📦 Body received:', body);
    const integration_id = body.integration_id;

    if (!integration_id) {
      console.error('❌ Missing integration_id in body:', body);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: integration_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Fetching sitemaps for integration:', integration_id);

    // Buscar integração com token válido
    const integration = await getIntegrationWithValidToken(integration_id);

    console.log('🔐 Integration found:', integration.connection_name);

    // If no gsc_property_url, get from site
    let propertyUrl = integration.gsc_property_url;
    if (!propertyUrl || propertyUrl === 'http://') {
      console.log('⚠️ Missing gsc_property_url, fetching from site...');
      const { data: site } = await supabase
        .from('rank_rent_sites')
        .select('site_url')
        .eq('id', integration.site_id)
        .single();
      
      propertyUrl = site?.site_url || '';
      console.log('📍 Site URL fetched:', propertyUrl);
      
      // Update integration with correct property URL
      if (propertyUrl) {
        await supabase
          .from('google_search_console_integrations')
          .update({ gsc_property_url: propertyUrl })
          .eq('id', integration_id);
        console.log('✅ Integration updated with property URL');
      }
    }

    // Encodar siteUrl para usar na URL
    const encodedSiteUrl = encodeURIComponent(propertyUrl);

    // Buscar lista de sitemaps via GSC API
    console.log('🔍 Fetching sitemaps from GSC API...');
    const gscResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps`,
      {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!gscResponse.ok) {
      const error = await gscResponse.text();
      console.error('❌ GSC API Error:', error);
      throw new Error(`Failed to fetch sitemaps from GSC: ${error}`);
    }

    const gscData = await gscResponse.json();
    const gscSitemaps = gscData.sitemap || [];
    
    console.log(`✅ Found ${gscSitemaps.length} sitemaps in GSC`);

    // Buscar submissions do banco de dados
    const { data: dbSubmissions, error: dbError } = await supabase
      .from('gsc_sitemap_submissions')
      .select('*')
      .eq('integration_id', integration_id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error('Failed to fetch sitemap submissions from database');
    }

    console.log(`📊 Found ${dbSubmissions?.length || 0} submissions in database`);

    // Merge dados: GSC + Database
    const sitemapsMap = new Map();

    // Adicionar sitemaps do GSC
    for (const gscSitemap of gscSitemaps) {
      const content = gscSitemap.contents?.[0] || {};
      sitemapsMap.set(gscSitemap.path, {
        sitemap_url: gscSitemap.path,
        sitemap_type: gscSitemap.isSitemapsIndex ? 'index' : 'regular',
        gsc_status: gscSitemap.warnings > 0 ? 'warning' : gscSitemap.errors > 0 ? 'error' : 'success',
        gsc_last_submitted: gscSitemap.lastSubmitted,
        gsc_last_downloaded: gscSitemap.lastDownloaded,
        page_count: parseInt(content.submitted) || 0,
        errors_count: parseInt(gscSitemap.errors) || 0,
        warnings_count: parseInt(gscSitemap.warnings) || 0,
        source: 'gsc',
        in_database: false,
      });
    }

    // Adicionar/atualizar com dados do banco
    for (const dbSubmission of (dbSubmissions || [])) {
      const existing = sitemapsMap.get(dbSubmission.sitemap_url);
      if (existing) {
        // Merge: preferir dados do GSC (mais recentes), mas manter ID do banco
        sitemapsMap.set(dbSubmission.sitemap_url, {
          ...existing,
          id: dbSubmission.id,
          created_at: dbSubmission.created_at,
          updated_at: dbSubmission.updated_at,
          in_database: true,
        });
      } else {
        // Sitemap só existe no banco (pode ter sido removido do GSC)
        sitemapsMap.set(dbSubmission.sitemap_url, {
          ...dbSubmission,
          source: 'database',
          in_database: true,
          possibly_deleted: true,
        });
      }
    }

    const mergedSitemaps = Array.from(sitemapsMap.values());

    console.log(`✅ Merged ${mergedSitemaps.length} total sitemaps`);

    // Atualizar banco com dados mais recentes do GSC
    for (const sitemap of mergedSitemaps) {
      if (sitemap.source === 'gsc') {
        const { error: upsertError } = await supabase
          .from('gsc_sitemap_submissions')
          .upsert({
            integration_id,
            site_id: integration.site_id,
            sitemap_url: sitemap.sitemap_url,
            sitemap_type: sitemap.sitemap_type,
            gsc_status: sitemap.gsc_status,
            gsc_last_submitted: sitemap.gsc_last_submitted,
            gsc_last_downloaded: sitemap.gsc_last_downloaded,
            page_count: sitemap.page_count || 0,
            errors_count: sitemap.errors_count || 0,
            warnings_count: sitemap.warnings_count || 0,
          }, {
            onConflict: 'integration_id,sitemap_url',
          });
        
        if (upsertError) {
          console.error(`❌ Error upserting sitemap ${sitemap.sitemap_url}:`, upsertError);
          throw new Error(`Failed to save sitemap: ${upsertError.message}`);
        }
        console.log(`✅ Saved sitemap: ${sitemap.sitemap_url} (${sitemap.page_count} páginas)`);
      }
    }

    console.log('✅ Database synchronized with GSC data');

    return new Response(
      JSON.stringify({
        success: true,
        sitemaps: mergedSitemaps,
        integration: {
          id: integration.id,
          connection_name: integration.connection_name,
          gsc_property_url: integration.gsc_property_url,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-get-sitemaps:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    // Detectar erro de permissão 403 e fornecer instruções claras
    if (errorMessage.includes('403') || errorMessage.includes('insufficient permission') || errorMessage.includes('forbidden')) {
      return new Response(
        JSON.stringify({
          error: '⚠️ Permissões Insuficientes no Google Search Console',
          message: 'A Service Account não tem permissões para acessar esta propriedade no GSC.',
          instructions: [
            '1. Acesse Google Search Console: https://search.google.com/search-console',
            '2. Selecione sua propriedade no GSC',
            '3. Vá em Configurações > Usuários e permissões',
            '4. Clique em "ADICIONAR USUÁRIO"',
            '5. Cole o email da Service Account (veja na configuração da integração)',
            '6. Selecione permissão "PROPRIETÁRIO" (obrigatório!)',
            '7. Aguarde 2-3 minutos para propagação',
            '8. Tente novamente'
          ],
          details: errorDetails,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
