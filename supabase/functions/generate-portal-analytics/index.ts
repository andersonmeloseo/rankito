import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portal_token, period_days = 30 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Validate token and get client_id
    const { data: portalData, error: portalError } = await supabase
      .from('client_portal_analytics')
      .select('client_id, user_id, report_config')
      .eq('portal_token', portal_token)
      .eq('enabled', true)
      .single();

    if (portalError || !portalData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or disabled portal token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching analytics for client: ${portalData.client_id}`);

    // 2. Fetch sites and pages
    const { data: sites, error: sitesError } = await supabase
      .from('rank_rent_sites')
      .select(`
        *,
        rank_rent_pages(*)
      `)
      .eq('client_id', portalData.client_id);

    if (sitesError) throw sitesError;

    const siteIds = sites?.map((s: any) => s.id) || [];

    // 3. Fetch conversions
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period_days);

    const { data: conversions, error: conversionsError } = await supabase
      .from('rank_rent_conversions')
      .select('*')
      .in('site_id', siteIds)
      .gte('created_at', startDate.toISOString());

    if (conversionsError) throw conversionsError;

    // 4. Calculate metrics
    const totalPages = sites?.reduce((acc: number, s: any) => 
      acc + (s.rank_rent_pages?.length || 0), 0) || 0;
    
    const totalConversions = conversions?.filter((c: any) => 
      c.event_type !== 'page_view').length || 0;
    
    const pageViews = conversions?.filter((c: any) => 
      c.event_type === 'page_view').length || 0;
    
    const conversionRate = pageViews > 0 ? (totalConversions / pageViews) * 100 : 0;
    
    const monthlyRevenue = sites?.reduce((acc: number, s: any) => 
      acc + (Number(s.monthly_rent_value) || 0), 0) || 0;

    // Group by event type
    const conversionsByType = conversions?.reduce((acc: any, conv: any) => {
      if (conv.event_type === 'page_view') return acc;
      if (!acc[conv.event_type]) {
        acc[conv.event_type] = { name: conv.event_type, value: 0 };
      }
      acc[conv.event_type].value++;
      return acc;
    }, {});

    // Daily stats
    const dailyStats = conversions?.reduce((acc: any, conv: any) => {
      const date = new Date(conv.created_at).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = { date, conversions: 0, pageViews: 0 };
      }
      if (conv.event_type === 'page_view') {
        acc[date].pageViews++;
      } else {
        acc[date].conversions++;
      }
      return acc;
    }, {});

    // Top pages
    const pageStats = conversions?.reduce((acc: any, conv: any) => {
      if (!acc[conv.page_path]) {
        acc[conv.page_path] = { path: conv.page_path, conversions: 0, pageViews: 0 };
      }
      if (conv.event_type === 'page_view') {
        acc[conv.page_path].pageViews++;
      } else {
        acc[conv.page_path].conversions++;
      }
      return acc;
    }, {});

    const topPages = Object.values(pageStats || {})
      .sort((a: any, b: any) => b.conversions - a.conversions)
      .slice(0, 10);

    const metrics = {
      total_sites: sites?.length || 0,
      total_pages: totalPages,
      total_conversions: totalConversions,
      page_views: pageViews,
      conversion_rate: conversionRate,
      monthly_revenue: monthlyRevenue,
      conversions_by_type: Object.values(conversionsByType || {}),
      daily_stats: Object.values(dailyStats || {}),
      top_pages: topPages,
    };

    console.log(`Analytics generated successfully for client: ${portalData.client_id}`);

    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
