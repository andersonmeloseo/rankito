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
    console.log('🚀 GSC Delete Sitemap - Request received');

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

    // Encodar siteUrl e feedpath para usar na URL
    const encodedSiteUrl = encodeURIComponent(integration.gsc_property_url);
    const encodedFeedpath = encodeURIComponent(sitemap_url);

    // Deletar sitemap via GSC API
    console.log('🗑️ Deleting sitemap from GSC...');
    const deleteResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      console.error('❌ GSC API Error:', error);
      throw new Error(`Failed to delete sitemap from GSC: ${error}`);
    }

    console.log('✅ Sitemap deleted from GSC');

    // Deletar do banco de dados
    const { error: dbError } = await supabase
      .from('gsc_sitemap_submissions')
      .delete()
      .eq('integration_id', integration_id)
      .eq('sitemap_url', sitemap_url);

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error('Failed to delete sitemap from database');
    }

    console.log('✅ Sitemap deleted from database');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemap deleted successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-delete-sitemap:', error);
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
