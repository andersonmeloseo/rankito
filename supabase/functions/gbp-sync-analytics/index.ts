import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
}

async function createJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/business.manage',
    aud: credentials.token_uri,
    exp: expiry,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = credentials.private_key.replace(/\\n/g, '\n');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(unsignedToken);
  
  const keyData = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyData, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${unsignedToken}.${encodedSignature}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const jwt = await createJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting GBP analytics sync...');

    // Buscar todos os perfis GBP ativos
    const { data: profiles, error: profilesError } = await supabase
      .from('google_business_profiles')
      .select('*')
      .eq('is_active', true);

    if (profilesError) {
      throw profilesError;
    }

    console.log(`📊 Found ${profiles?.length || 0} active GBP profiles`);

    let successCount = 0;
    let errorCount = 0;

    for (const profile of profiles || []) {
      try {
        console.log(`\n🔍 Processing profile: ${profile.connection_name}`);

        // Gerar access token
        const credentials = profile.service_account_json as ServiceAccountCredentials;
        const accessToken = await getAccessToken(credentials);

        // Calcular período de 30 dias atrás
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Chamar API do Google My Business para métricas
        const metricsResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/${profile.location_name}/insights:getDailyMetricsTimeSeries?` +
          new URLSearchParams({
            'dailyRange.startDate.year': startDate.getFullYear().toString(),
            'dailyRange.startDate.month': (startDate.getMonth() + 1).toString(),
            'dailyRange.startDate.day': startDate.getDate().toString(),
            'dailyRange.endDate.year': endDate.getFullYear().toString(),
            'dailyRange.endDate.month': (endDate.getMonth() + 1).toString(),
            'dailyRange.endDate.day': endDate.getDate().toString(),
            'dailyMetric': 'QUERIES_DIRECT',
          }),
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!metricsResponse.ok) {
          console.error(`❌ Failed to fetch metrics for ${profile.connection_name}: ${metricsResponse.statusText}`);
          errorCount++;
          
          // Atualizar status de health
          await supabase
            .from('google_business_profiles')
            .update({
              health_status: 'unhealthy',
              last_error: `Failed to fetch metrics: ${metricsResponse.statusText}`,
              consecutive_failures: (profile.consecutive_failures || 0) + 1,
            })
            .eq('id', profile.id);
          
          continue;
        }

        const metricsData = await metricsResponse.json();
        console.log(`✅ Fetched metrics for ${profile.connection_name}`);

        // Processar e inserir métricas no banco
        const timeSeries = metricsData.timeSeries || {};
        const dailyMetrics = timeSeries.datedValues || [];

        for (const metric of dailyMetrics) {
          const metricDate = `${metric.date.year}-${String(metric.date.month).padStart(2, '0')}-${String(metric.date.day).padStart(2, '0')}`;
          
          const analyticsData = {
            profile_id: profile.id,
            site_id: profile.site_id,
            metric_date: metricDate,
            searches_direct: metric.value || 0,
            searches_discovery: 0, // Seria necessário fazer chamadas separadas para cada métrica
            searches_branded: 0,
            profile_views: 0,
            profile_clicks: 0,
            actions_website: 0,
            actions_phone: 0,
            actions_directions: 0,
            photos_count_merchant: 0,
            photos_count_customers: 0,
            photos_views_merchant: 0,
            photos_views_customers: 0,
          };

          // Inserir ou atualizar
          const { error: insertError } = await supabase
            .from('gbp_analytics')
            .upsert(analyticsData, {
              onConflict: 'profile_id,metric_date',
            });

          if (insertError) {
            console.error(`❌ Error inserting metric for ${metricDate}:`, insertError);
          }
        }

        // Atualizar perfil com sucesso
        await supabase
          .from('google_business_profiles')
          .update({
            last_sync_at: new Date().toISOString(),
            health_status: 'healthy',
            last_error: null,
            consecutive_failures: 0,
          })
          .eq('id', profile.id);

        successCount++;
        console.log(`✅ Successfully synced analytics for ${profile.connection_name}`);

      } catch (error) {
        console.error(`❌ Error processing profile ${profile.connection_name}:`, error);
        errorCount++;

        const errorMessage = error instanceof Error ? error.message : String(error);

        // Atualizar status de erro
        await supabase
          .from('google_business_profiles')
          .update({
            health_status: 'unhealthy',
            last_error: errorMessage,
            consecutive_failures: (profile.consecutive_failures || 0) + 1,
          })
          .eq('id', profile.id);
      }
    }

    console.log(`\n✅ Sync completed: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${successCount} profiles, ${errorCount} errors`,
        processed: successCount + errorCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in gbp-sync-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
