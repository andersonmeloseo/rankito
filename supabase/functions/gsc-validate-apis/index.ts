import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-helpers.ts';
import { comparePropertyUrl } from '../_shared/gsc-property-detector.ts';

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
    console.log('🔍 GSC API Validation - Request received');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { integration_id } = await req.json();

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: 'Missing integration_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Validating integration:', integration_id);

    // Get integration with valid token
    const integration = await getIntegrationWithValidToken(integration_id);

    const results = {
      search_console_api: { active: false, error: null as string | null },
      indexing_api: { active: false, error: null as string | null },
      gsc_permissions: { valid: false, level: null as string | null, error: null as string | null },
      property_detection: {
        available_properties: [] as string[],
        configured_url: null as string | null,
        url_matches: false,
        suggested_url: null as string | null,
      },
      overall_status: 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy',
    };

    // Test 1: Search Console API (fetch properties)
    try {
      console.log('🔍 Testing Search Console API...');
      const gscResponse = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
          },
        }
      );

      if (gscResponse.ok) {
        results.search_console_api.active = true;
        console.log('✅ Search Console API: Active');
      } else {
        const errorData = await gscResponse.json();
        results.search_console_api.error = errorData.error?.message || 'API not accessible';
        console.log('❌ Search Console API: Error -', results.search_console_api.error);
      }
    } catch (error) {
      results.search_console_api.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Search Console API: Exception -', results.search_console_api.error);
    }

    // Test 2: Web Search Indexing API (test metadata endpoint)
    try {
      console.log('🔍 Testing Web Search Indexing API...');
      
      // Try to fetch metadata for a URL (this tests if API is enabled)
      const testUrl = integration.gsc_property_url || 'https://example.com';
      const indexingResponse = await fetch(
        `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(testUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
          },
        }
      );

      if (indexingResponse.ok || indexingResponse.status === 404) {
        // 404 is OK - means API is enabled but URL not found
        results.indexing_api.active = true;
        console.log('✅ Web Search Indexing API: Active');
      } else {
        const errorData = await indexingResponse.json();
        
        // Check if error is specifically about API not being enabled
        if (errorData.error?.message?.includes('API has not been used') ||
            errorData.error?.code === 403) {
          results.indexing_api.error = 'API não habilitada no projeto Google Cloud';
        } else {
          results.indexing_api.error = errorData.error?.message || 'API not accessible';
        }
        console.log('❌ Web Search Indexing API: Error -', results.indexing_api.error);
      }
    } catch (error) {
      results.indexing_api.error = error instanceof Error ? error.message : 'Unknown error';
      console.log('❌ Web Search Indexing API: Exception -', results.indexing_api.error);
    }

    // Test 3: GSC Permissions (check if service account has proper access)
    if (integration.gsc_property_url) {
      try {
        console.log('🔍 Testing GSC Permissions...');
        const permissionsResponse = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(integration.gsc_property_url)}`,
          {
            headers: {
              'Authorization': `Bearer ${integration.access_token}`,
            },
          }
        );

        if (permissionsResponse.ok) {
          const data = await permissionsResponse.json();
          results.gsc_permissions.valid = true;
          results.gsc_permissions.level = data.permissionLevel || 'Unknown';
          console.log('✅ GSC Permissions: Valid -', results.gsc_permissions.level);
        } else {
          const errorData = await permissionsResponse.json();
          results.gsc_permissions.error = errorData.error?.message || 'Permission check failed';
          console.log('❌ GSC Permissions: Error -', results.gsc_permissions.error);
        }
      } catch (error) {
        results.gsc_permissions.error = error instanceof Error ? error.message : 'Unknown error';
        console.log('❌ GSC Permissions: Exception -', results.gsc_permissions.error);
      }
    } else {
      results.gsc_permissions.error = 'No GSC property URL configured';
    }

    // Test 4: Property Detection
    try {
      console.log('🔍 Detecting GSC properties...');
      
      // Get site URL for comparison
      const { data: siteData } = await supabase
        .from('rank_rent_sites')
        .select('site_url')
        .eq('id', integration.site_id)
        .single();

      const siteUrl = siteData?.site_url || '';
      
      const propertyDetection = await comparePropertyUrl(
        integration.access_token,
        integration.gsc_property_url,
        siteUrl
      );
      
      results.property_detection = propertyDetection;
      console.log('✅ Property Detection:', propertyDetection);
    } catch (error) {
      console.error('❌ Property Detection Error:', error);
      results.property_detection = {
        available_properties: [],
        configured_url: integration.gsc_property_url,
        url_matches: false,
        suggested_url: null,
      };
    }

    // Determine overall status
    const allActive = results.search_console_api.active && 
                     results.indexing_api.active && 
                     results.gsc_permissions.valid;
    
    const someActive = results.search_console_api.active || 
                      results.indexing_api.active;

    if (allActive) {
      results.overall_status = 'healthy';
    } else if (someActive) {
      results.overall_status = 'degraded';
    } else {
      results.overall_status = 'unhealthy';
    }

    console.log('📊 Validation complete. Overall status:', results.overall_status);

    return new Response(
      JSON.stringify({
        success: true,
        integration_id,
        integration_name: integration.connection_name,
        validation: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gsc-validate-apis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
