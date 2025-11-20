import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemHealthMetrics {
  overallScore: number;
  edgeFunctionsScore: number;
  gscIntegrationsScore: number;
  geolocationScore: number;
  issues: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting system health check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate health metrics
    const metrics = await calculateHealthMetrics(supabase);

    console.log(`📊 Overall health score: ${metrics.overallScore}`);

    // If health score is critical (< 70), create notifications for all super admins
    if (metrics.overallScore < 70) {
      console.warn(`⚠️ CRITICAL: Health score below threshold (${metrics.overallScore})`);
      await notifySuperAdmins(supabase, metrics);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics,
        notificationCreated: metrics.overallScore < 70 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error checking system health:', error);
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

async function calculateHealthMetrics(supabase: any): Promise<SystemHealthMetrics> {
  const issues: string[] = [];

  // Check GSC integrations health
  const { data: gscIntegrations } = await supabase
    .from('google_search_console_integrations')
    .select('id, health_status, is_active');

  const totalGscActive = gscIntegrations?.filter((i: any) => i.is_active).length || 0;
  const gscHealthy = gscIntegrations?.filter((i: any) => i.health_status === 'healthy' && i.is_active).length || 0;
  const gscScore = totalGscActive > 0 ? (gscHealthy / totalGscActive) * 100 : 100;

  if (gscScore < 50 && totalGscActive > 0) {
    issues.push(`${totalGscActive - gscHealthy} integrações GSC com problemas`);
  }

  // Check Geolocation APIs health
  const { data: geoApis } = await supabase
    .from('geolocation_api_configs')
    .select('id, is_active, error_count');

  const totalGeoActive = geoApis?.filter((api: any) => api.is_active).length || 0;
  const geoHealthy = geoApis?.filter((api: any) => api.is_active && (api.error_count || 0) < 10).length || 0;
  const geoScore = totalGeoActive > 0 ? (geoHealthy / totalGeoActive) * 100 : 100;

  if (geoScore < 50 && totalGeoActive > 0) {
    issues.push(`${totalGeoActive - geoHealthy} APIs de geolocalização com erros`);
  }

  // Check unresolved GSC alerts
  const { data: unresolvedAlerts, count: alertCount } = await supabase
    .from('gsc_indexing_alerts')
    .select('*', { count: 'exact' })
    .is('resolved_at', null)
    .in('severity', ['critical', 'high']);

  if ((alertCount || 0) > 10) {
    issues.push(`${alertCount} alertas GSC não resolvidos`);
  }

  // Edge Functions score (simulated - would need actual monitoring)
  const edgeFunctionsScore = 95; // Placeholder

  // Calculate overall score
  const overallScore = Math.round(
    (gscScore * 0.4) + (geoScore * 0.3) + (edgeFunctionsScore * 0.3)
  );

  return {
    overallScore,
    edgeFunctionsScore,
    gscIntegrationsScore: Math.round(gscScore),
    geolocationScore: Math.round(geoScore),
    issues,
  };
}

async function notifySuperAdmins(supabase: any, metrics: SystemHealthMetrics) {
  // Get all super admin users
  const { data: superAdminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin');

  if (!superAdminRoles || superAdminRoles.length === 0) {
    console.warn('⚠️ No super admins found to notify');
    return;
  }

  const severity = metrics.overallScore < 50 ? 'critical' : 'warning';
  const type = severity === 'critical' ? 'health_critical' : 'health_warning';

  // Create notifications for each super admin
  const notifications = superAdminRoles.map((role: any) => ({
    user_id: role.user_id,
    type,
    title: `${severity === 'critical' ? '🚨' : '⚠️'} Alerta de Saúde do Sistema`,
    message: `Score de saúde em ${metrics.overallScore}%. Problemas: ${metrics.issues.join(', ')}`,
    link: '/super-admin?tab=monitoring',
    metadata: { severity, score: metrics.overallScore, issues: metrics.issues },
  }));

  const { error } = await supabase
    .from('user_notifications')
    .insert(notifications);

  if (error) {
    console.error('❌ Error creating notifications:', error);
  } else {
    console.log(`✅ Created ${notifications.length} health alert notifications`);
  }
}
