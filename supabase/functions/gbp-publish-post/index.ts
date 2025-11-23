import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { getIntegrationWithValidToken } from '../_shared/gbp-oauth-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Starting GBP Post Publishing...');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: posts } = await supabase.from('gbp_posts').select('*').eq('status', 'scheduled').lte('scheduled_for', new Date().toISOString());
    if (!posts?.length) {
      return new Response(JSON.stringify({ message: 'No posts to publish' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let published = 0;
    for (const post of posts) {
      try {
        const integration = await getIntegrationWithValidToken(post.profile_id);
        const payload: any = { languageCode: 'pt-BR', summary: post.content };
        
        if (post.title) payload.title = post.title;
        if (post.cta_type && post.cta_url) payload.callToAction = { actionType: post.cta_type, url: post.cta_url };
        if (post.media_urls?.length) payload.media = post.media_urls.map((url: string) => ({ mediaFormat: 'PHOTO', sourceUrl: url }));

        const response = await fetch(`https://mybusiness.googleapis.com/v4/${integration.location_name}/localPosts`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${integration.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const result = await response.json();
        await supabase.from('gbp_posts').update({ status: 'published', published_at: new Date().toISOString(), google_post_id: result.name }).eq('id', post.id);
        published++;
      } catch (err) {
        await supabase.from('gbp_posts').update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' }).eq('id', post.id);
      }
    }

    return new Response(JSON.stringify({ success: true, published }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
