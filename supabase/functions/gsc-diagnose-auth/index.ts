import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getIntegrationWithValidToken } from '../_shared/gsc-jwt-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integrationId } = await req.json();
    console.log(`🔍 Diagnosticando integração: ${integrationId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar integração
    const { data: integration, error: integrationError } = await supabase
      .from('google_search_console_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integração não encontrada');
    }

    console.log('✅ Integração encontrada:', {
      id: integration.id,
      name: integration.connection_name,
      hasServiceAccount: !!integration.service_account_json,
    });

    // Testar geração do access token
    let tokenResult;
    try {
      const integrationData = await getIntegrationWithValidToken(integrationId);
      tokenResult = {
        success: true,
        hasToken: !!integrationData.access_token,
        tokenPreview: integrationData.access_token?.substring(0, 20) + '...',
      };
      console.log('✅ Access token gerado com sucesso');
    } catch (error) {
      tokenResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      console.error('❌ Erro ao gerar token:', error);
    }

    // Testar Search Console API
    let searchConsoleTest;
    try {
      const integrationData = await getIntegrationWithValidToken(integrationId);
      const response = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            'Authorization': `Bearer ${integrationData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      searchConsoleTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: response.ok ? await response.json() : await response.text(),
      };
      
      if (response.ok) {
        console.log('✅ Search Console API: OK');
      } else {
        console.error('❌ Search Console API: FALHOU');
      }
    } catch (error) {
      searchConsoleTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Testar Web Search Indexing API
    let indexingApiTest;
    try {
      const integrationData = await getIntegrationWithValidToken(integrationId);
      const testUrl = integration.gsc_property_url || 'https://example.com';
      
      const response = await fetch(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integrationData.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: testUrl,
            type: 'URL_UPDATED',
          }),
        }
      );

      indexingApiTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: response.ok ? await response.json() : await response.text(),
      };

      if (response.ok) {
        console.log('✅ Web Search Indexing API: OK');
      } else {
        console.error('❌ Web Search Indexing API: FALHOU');
      }
    } catch (error) {
      indexingApiTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Testar Inspection API
    let inspectionApiTest;
    try {
      const integrationData = await getIntegrationWithValidToken(integrationId);
      const testUrl = integration.gsc_property_url || 'https://example.com';
      const siteUrl = integration.gsc_property_url;
      
      const response = await fetch(
        `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integrationData.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inspectionUrl: testUrl,
            siteUrl: siteUrl,
          }),
        }
      );

      inspectionApiTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: response.ok ? await response.json() : await response.text(),
      };

      if (response.ok) {
        console.log('✅ URL Inspection API: OK');
      } else {
        console.error('❌ URL Inspection API: FALHOU');
      }
    } catch (error) {
      inspectionApiTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    const diagnostics = {
      integration: {
        id: integration.id,
        name: integration.connection_name,
        email: integration.google_email,
        propertyUrl: integration.gsc_property_url,
      },
      tokenGeneration: tokenResult,
      searchConsoleApi: searchConsoleTest,
      indexingApi: indexingApiTest,
      inspectionApi: inspectionApiTest,
      recommendations: generateRecommendations(tokenResult, searchConsoleTest, indexingApiTest, inspectionApiTest),
    };

    return new Response(
      JSON.stringify(diagnostics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateRecommendations(token: any, searchConsole: any, indexing: any, inspection: any): string[] {
  const recommendations: string[] = [];

  if (!token.success) {
    recommendations.push('❌ CRÍTICO: Não foi possível gerar access token. Verifique o JSON da Service Account.');
  }

  if (searchConsole && !searchConsole.success) {
    if (searchConsole.status === 401) {
      recommendations.push('❌ Search Console API: Credenciais inválidas. Verifique se a API está habilitada no Google Cloud.');
    } else if (searchConsole.status === 403) {
      recommendations.push('❌ Search Console API: Sem permissões. Adicione a Service Account como Owner na propriedade GSC.');
    }
  }

  if (indexing && !indexing.success) {
    if (indexing.status === 403) {
      recommendations.push('⚠️ Web Search Indexing API: Não habilitada. Habilite no Google Cloud Console.');
    }
  }

  if (inspection && !inspection.success) {
    if (inspection.status === 401) {
      recommendations.push('❌ URL Inspection API: Autenticação falhou. Verifique as credenciais.');
    } else if (inspection.status === 403) {
      recommendations.push('❌ URL Inspection API: Sem permissões ou URL incorreta. Verifique se a Service Account é Owner e se a URL da propriedade está exata.');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Todas as APIs funcionando corretamente!');
  }

  return recommendations;
}
