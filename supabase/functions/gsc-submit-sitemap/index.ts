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
    console.log('🚀 GSC Submit Sitemap - Request received');

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
    const { integration_id, sitemap_url } = await req.json();

    if (!integration_id || !sitemap_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: integration_id, sitemap_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Params:', { integration_id, sitemap_url });

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

    // Encodar siteUrl e feedpath para usar na URL
    const encodedSiteUrl = encodeURIComponent(propertyUrl);
    const encodedFeedpath = encodeURIComponent(sitemap_url);

    // Submeter sitemap via GSC API
    console.log('📤 Submitting sitemap to GSC...');
    const submitResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      console.error('❌ GSC API Error:', error);
      throw new Error(`Failed to submit sitemap to GSC: ${error}`);
    }

    console.log('✅ Sitemap submitted to GSC');

    // Buscar detalhes do sitemap recém-submetido
    console.log('🔍 Fetching sitemap details...');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
      {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let sitemapDetails = null;
    if (detailsResponse.ok) {
      sitemapDetails = await detailsResponse.json();
      console.log('📊 Sitemap details:', sitemapDetails);
    }

    // Salvar no banco (upsert baseado em integration_id + sitemap_url)
    const { data: submission, error: dbError } = await supabase
      .from('gsc_sitemap_submissions')
      .upsert({
        integration_id,
        site_id: integration.site_id,
        sitemap_url,
        sitemap_type: sitemapDetails?.isSitemapsIndex ? 'index' : 'regular',
        gsc_status: sitemapDetails?.warnings ? 'warning' : 'success',
        gsc_last_submitted: sitemapDetails?.lastSubmitted || new Date().toISOString(),
        gsc_last_downloaded: sitemapDetails?.lastDownloaded || null,
        urls_submitted: sitemapDetails?.contents?.[0]?.submitted || 0,
        urls_indexed: sitemapDetails?.contents?.[0]?.indexed || 0,
        gsc_errors_count: sitemapDetails?.errors || 0,
        gsc_warnings_count: sitemapDetails?.warnings || 0,
      }, {
        onConflict: 'integration_id,sitemap_url',
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error('Failed to save sitemap submission');
    }

    console.log('✅ Sitemap saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        submission,
        gsc_details: sitemapDetails,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-submit-sitemap:', error);
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
