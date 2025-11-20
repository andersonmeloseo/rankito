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
    console.log('⏰ Checking for expiring trials...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get trials expiring in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    const { data: expiringTrials } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        trial_end_date,
        plan_id,
        subscription_plans!inner(name)
      `)
      .eq('status', 'trial')
      .gte('trial_end_date', today)
      .lte('trial_end_date', threeDaysStr);

    if (!expiringTrials || expiringTrials.length === 0) {
      console.log('✅ No expiring trials found');
      return new Response(
        JSON.stringify({ success: true, expiringTrials: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${expiringTrials.length} expiring trials`);

    // Create notifications for users
    const userNotifications = expiringTrials.map((sub: any) => {
      const daysLeft = Math.ceil(
        (new Date(sub.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        user_id: sub.user_id,
        type: 'trial_expiring',
        title: '⏰ Seu período de teste está acabando',
        message: `Faltam ${daysLeft} dia(s) para seu período de teste do plano ${sub.subscription_plans.name} expirar. Faça upgrade para continuar usando o Rankito CRM.`,
        link: '/settings?tab=subscription',
      };
    });

    // Create notifications for super admins
    const { data: superAdminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    const adminNotifications = (superAdminRoles || []).map((role: any) => ({
      user_id: role.user_id,
      type: 'trial_expiring',
      title: '⏰ Trials Expirando',
      message: `${expiringTrials.length} trial(s) expiram nos próximos 3 dias. Verifique a necessidade de ações.`,
      link: '/super-admin?tab=users',
      metadata: { count: expiringTrials.length },
    }));

    // Insert all notifications
    const allNotifications = [...userNotifications, ...adminNotifications];
    const { error } = await supabase
      .from('user_notifications')
      .insert(allNotifications);

    if (error) {
      console.error('❌ Error creating notifications:', error);
      throw error;
    }

    console.log(`✅ Created ${allNotifications.length} trial expiration notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expiringTrials: expiringTrials.length,
        notificationsCreated: allNotifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error checking expiring trials:', error);
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
