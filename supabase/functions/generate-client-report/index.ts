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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { access_token, start_date, end_date } = await req.json();

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'Missing access_token' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating report for token:', access_token);

    // Find client by access token
    const { data: client, error: clientError } = await supabase
      .from('rank_rent_clients')
      .select('*')
      .eq('access_token', access_token)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', access_token, clientError);
      return new Response(
        JSON.stringify({ error: 'Invalid access token' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client pages
    const { data: pages, error: pagesError } = await supabase
      .from('rank_rent_pages')
      .select('*')
      .eq('client_id', client.id)
      .eq('is_rented', true);

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      throw pagesError;
    }

    // Get conversions for date range
    const pageIds = pages?.map(p => p.id) || [];
    
    let conversionsQuery = supabase
      .from('rank_rent_conversions')
      .select('*')
      .in('page_id', pageIds);

    if (start_date) {
      conversionsQuery = conversionsQuery.gte('created_at', start_date);
    }
    if (end_date) {
      conversionsQuery = conversionsQuery.lte('created_at', end_date);
    }

    const { data: conversions, error: conversionsError } = await conversionsQuery;

    if (conversionsError) {
      console.error('Error fetching conversions:', conversionsError);
      throw conversionsError;
    }

    // Calculate metrics
    const totalPageViews = conversions?.filter(c => c.event_type === 'page_view').length || 0;
    const totalConversions = conversions?.filter(c => c.event_type !== 'page_view').length || 0;
    const conversionRate = totalPageViews > 0 
      ? ((totalConversions / totalPageViews) * 100).toFixed(2) 
      : 0;

    // Group conversions by event type
    const conversionsByType = conversions?.reduce((acc: Record<string, number>, conv) => {
      if (conv.event_type !== 'page_view') {
        acc[conv.event_type] = (acc[conv.event_type] || 0) + 1;
      }
      return acc;
    }, {});

    // Group conversions by date
    const conversionsByDate = conversions?.reduce((acc: Record<string, { page_views: number, conversions: number }>, conv) => {
      const date = new Date(conv.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { page_views: 0, conversions: 0 };
      }
      if (conv.event_type === 'page_view') {
        acc[date].page_views++;
      } else {
        acc[date].conversions++;
      }
      return acc;
    }, {});

    // Calculate metrics per page
    const pageMetrics = pages?.map(page => {
      const pageConversions = conversions?.filter(c => c.page_id === page.id) || [];
      const pageViews = pageConversions.filter(c => c.event_type === 'page_view').length;
      const pageConv = pageConversions.filter(c => c.event_type !== 'page_view').length;
      
      return {
        page_url: page.page_url,
        page_title: page.page_title,
        page_views: pageViews,
        conversions: pageConv,
        conversion_rate: pageViews > 0 ? ((pageConv / pageViews) * 100).toFixed(2) : 0
      };
    });

    const report = {
      client: {
        name: client.name,
        company: client.company,
        email: client.email
      },
      period: {
        start_date: start_date || 'All time',
        end_date: end_date || 'Now'
      },
      summary: {
        total_pages: pages?.length || 0,
        total_page_views: totalPageViews,
        total_conversions: totalConversions,
        conversion_rate: conversionRate,
        monthly_value: pages?.reduce((sum, p) => sum + (Number(p.monthly_rent_value) || 0), 0) || 0
      },
      conversions_by_type: conversionsByType,
      daily_stats: conversionsByDate,
      pages: pageMetrics
    };

    console.log('Report generated successfully');

    return new Response(
      JSON.stringify(report), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});