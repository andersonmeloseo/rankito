import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    console.log('🚀 GSC Get Sitemaps - Request received');

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

    // Parse request
    const url = new URL(req.url);
    const integration_id = url.searchParams.get('integration_id');

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: integration_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Fetching sitemaps for integration:', integration_id);

    // Buscar integração com token válido
    const integration = await getIntegrationWithValidToken(integration_id);

    console.log('🔐 Integration found:', integration.connection_name);

    // Encodar siteUrl para usar na URL
    const encodedSiteUrl = encodeURIComponent(integration.gsc_property_url);

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
        urls_submitted: content.submitted || 0,
        urls_indexed: content.indexed || 0,
        gsc_errors_count: gscSitemap.errors || 0,
        gsc_warnings_count: gscSitemap.warnings || 0,
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
        await supabase
          .from('gsc_sitemap_submissions')
          .upsert({
            integration_id,
            site_id: integration.site_id,
            sitemap_url: sitemap.sitemap_url,
            sitemap_type: sitemap.sitemap_type,
            gsc_status: sitemap.gsc_status,
            gsc_last_submitted: sitemap.gsc_last_submitted,
            gsc_last_downloaded: sitemap.gsc_last_downloaded,
            urls_submitted: sitemap.urls_submitted,
            urls_indexed: sitemap.urls_indexed,
            gsc_errors_count: sitemap.gsc_errors_count,
            gsc_warnings_count: sitemap.gsc_warnings_count,
          }, {
            onConflict: 'integration_id,sitemap_url',
          });
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
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
