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
    console.log('📊 Checking GSC quota exceeded...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Get all sites with active GSC integrations
    const { data: sites } = await supabase
      .from('rank_rent_sites')
      .select(`
        id,
        site_name,
        owner_user_id,
        google_search_console_integrations!inner(
          id,
          is_active
        )
      `)
      .eq('google_search_console_integrations.is_active', true);

    if (!sites || sites.length === 0) {
      console.log('✅ No active GSC integrations found');
      return new Response(
        JSON.stringify({ success: true, quotaExceeded: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quotaExceededSites: any[] = [];

    // Check quota for each site
    for (const site of sites) {
      const integrationIds = site.google_search_console_integrations.map((i: any) => i.id);

      // Count today's indexing requests per integration
      const { count: totalRequests } = await supabase
        .from('gsc_url_indexing_requests')
        .select('*', { count: 'exact', head: true })
        .in('integration_id', integrationIds)
        .gte('created_at', today);

      const dailyLimit = integrationIds.length * 200; // 200 URLs/day per integration

      if ((totalRequests || 0) >= dailyLimit) {
        quotaExceededSites.push({
          siteId: site.id,
          siteName: site.site_name,
          ownerId: site.owner_user_id,
          used: totalRequests,
          limit: dailyLimit,
        });
      }
    }

    if (quotaExceededSites.length === 0) {
      console.log('✅ No sites with exceeded quota');
      return new Response(
        JSON.stringify({ success: true, quotaExceeded: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`⚠️ Found ${quotaExceededSites.length} sites with exceeded quota`);

    // Create notifications for site owners
    const ownerNotifications = quotaExceededSites.map((site) => ({
      user_id: site.ownerId,
      type: 'quota_exceeded',
      title: '📊 Cota GSC Excedida',
      message: `O site "${site.siteName}" excedeu a cota diária de indexação (${site.used}/${site.limit} URLs). A cota será resetada em 24h.`,
      link: `/sites/${site.siteId}?tab=gsc`,
      metadata: { siteId: site.siteId, used: site.used, limit: site.limit },
    }));

    // Create notification for super admins
    const { data: superAdminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    const adminNotifications = (superAdminRoles || []).map((role: any) => ({
      user_id: role.user_id,
      type: 'quota_exceeded',
      title: '📊 Cotas GSC Excedidas',
      message: `${quotaExceededSites.length} site(s) excederam a cota diária de indexação GSC.`,
      link: '/super-admin?tab=monitoring',
      metadata: { count: quotaExceededSites.length },
    }));

    // Insert all notifications
    const allNotifications = [...ownerNotifications, ...adminNotifications];
    const { error } = await supabase
      .from('user_notifications')
      .insert(allNotifications);

    if (error) {
      console.error('❌ Error creating notifications:', error);
      throw error;
    }

    console.log(`✅ Created ${allNotifications.length} quota exceeded notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        quotaExceeded: quotaExceededSites.length,
        notificationsCreated: allNotifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error checking quota exceeded:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
