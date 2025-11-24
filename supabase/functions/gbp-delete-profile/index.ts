import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗑️ Deleting GBP profile...');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { profile_id } = await req.json();
    
    if (!profile_id) {
      throw new Error('Missing profile_id');
    }

    // Get profile to verify ownership (LEFT JOIN porque site_id pode ser NULL)
    const { data: profile, error: profileError } = await supabase
      .from('google_business_profiles')
      .select(`
        id,
        user_id,
        site_id,
        refresh_token,
        rank_rent_sites!left(owner_user_id)
      `)
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile query error:', profileError);
      throw new Error('Profile not found');
    }

    console.log('Profile found:', { 
      profile_id: profile.id, 
      user_id: profile.user_id,
      site_id: profile.site_id,
      has_site: !!profile.site_id 
    });

    // Check ownership
    // Se tem site associado, verifica owner_user_id do site
    // Se não tem site, verifica user_id do perfil diretamente
    const isOwner = profile.site_id
      ? (profile as any).rank_rent_sites?.owner_user_id === user.id
      : profile.user_id === user.id;

    if (!isOwner) {
      console.error('Ownership check failed:', {
        authenticated_user: user.id,
        profile_user_id: profile.user_id,
        site_owner: (profile as any).rank_rent_sites?.owner_user_id
      });
      throw new Error('Unauthorized');
    }

    // Optional: Revoke token at Google (best effort, don't fail if it doesn't work)
    if (profile.refresh_token) {
      try {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: profile.refresh_token,
          }),
        });
        console.log('✅ Token revoked at Google');
      } catch (e) {
        console.log('⚠️ Failed to revoke token at Google (continuing anyway)');
      }
    }

    // Delete profile (CASCADE will delete reviews, posts, analytics)
    const { error: deleteError } = await supabase
      .from('google_business_profiles')
      .delete()
      .eq('id', profile_id);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ GBP profile deleted successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in gbp-delete-profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
