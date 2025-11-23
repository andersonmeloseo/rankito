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

    console.log('📤 Starting GBP post publishing...');

    // Buscar posts agendados que devem ser publicados
    const { data: posts, error: postsError } = await supabase
      .from('gbp_posts')
      .select('*, google_business_profiles(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (postsError) {
      throw postsError;
    }

    console.log(`📝 Found ${posts?.length || 0} posts to publish`);

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts || []) {
      try {
        console.log(`\n📤 Publishing post: ${post.id}`);

        const profile = post.google_business_profiles;
        if (!profile) {
          throw new Error('Profile not found for post');
        }

        // Gerar access token
        const credentials = profile.service_account_json as ServiceAccountCredentials;
        const accessToken = await getAccessToken(credentials);

        // Preparar payload do post
        const postPayload: any = {
          languageCode: 'pt-BR',
          summary: post.content,
        };

        // Adicionar campos específicos por tipo
        if (post.post_type === 'EVENT') {
          postPayload.event = {
            title: post.title || '',
            schedule: {
              startDate: post.event_start_date,
              endDate: post.event_end_date,
            },
          };
        } else if (post.post_type === 'OFFER') {
          postPayload.offer = {
            couponCode: post.offer_coupon_code || '',
            redeemOnlineUrl: post.cta_url || '',
            termsConditions: post.offer_terms || '',
          };
        }

        // Adicionar CTA se houver
        if (post.cta_type && post.cta_url) {
          postPayload.callToAction = {
            actionType: post.cta_type,
            url: post.cta_url,
          };
        }

        // Adicionar mídia se houver
        if (post.media_urls && post.media_urls.length > 0) {
          postPayload.media = post.media_urls.map((url: string) => ({
            mediaFormat: 'PHOTO',
            sourceUrl: url,
          }));
        }

        // Publicar post na API do Google
        const publishResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/${profile.location_name}/localPosts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postPayload),
          }
        );

        if (!publishResponse.ok) {
          const errorText = await publishResponse.text();
          console.error(`❌ Failed to publish post: ${publishResponse.statusText}`, errorText);
          
          // Atualizar status para failed
          await supabase
            .from('gbp_posts')
            .update({
              status: 'failed',
              error_message: `${publishResponse.statusText}: ${errorText}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id);
          
          errorCount++;
          continue;
        }

        const publishedPost = await publishResponse.json();
        console.log(`✅ Post published successfully:`, publishedPost);

        // Atualizar post com sucesso
        await supabase
          .from('gbp_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            google_post_id: publishedPost.name || null,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        successCount++;
        console.log(`✅ Successfully published post ${post.id}`);

      } catch (error) {
        console.error(`❌ Error publishing post ${post.id}:`, error);
        errorCount++;

        const errorMessage = error instanceof Error ? error.message : String(error);

        // Atualizar status de erro
        await supabase
          .from('gbp_posts')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);
      }
    }

    console.log(`\n✅ Publishing completed: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${successCount} posts, ${errorCount} errors`,
        processed: successCount + errorCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in gbp-publish-post:', error);
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
