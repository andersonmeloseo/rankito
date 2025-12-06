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

    const { siteId, startDate, endDate, goalIds } = await req.json();

    if (!siteId) {
      return new Response(
        JSON.stringify({ error: 'siteId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[export-google-ads] Exporting conversions for site ${siteId}`);

    // Build query for conversions with gclid
    let query = supabase
      .from('rank_rent_conversions')
      .select('id, created_at, event_type, gclid, conversion_value, cta_text, page_url')
      .eq('site_id', siteId)
      .not('gclid', 'is', null)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: conversions, error } = await query;

    if (error) {
      console.error('[export-google-ads] Query error:', error);
      throw error;
    }

    console.log(`[export-google-ads] Found ${conversions?.length || 0} conversions with gclid`);

    // Generate CSV in Google Ads Offline Conversions format
    // Required columns: Google Click ID, Conversion Name, Conversion Time, Conversion Value, Conversion Currency
    const csvHeaders = [
      'Google Click ID',
      'Conversion Name', 
      'Conversion Time',
      'Conversion Value',
      'Conversion Currency'
    ];

    const csvRows = (conversions || []).map(conv => {
      // Format timestamp for Google Ads (ISO 8601 with timezone)
      const conversionTime = new Date(conv.created_at).toISOString();
      
      // Determine conversion name from event type
      let conversionName = 'Rankito Conversion';
      if (conv.event_type) {
        const eventTypeMap: Record<string, string> = {
          'whatsapp_click': 'WhatsApp Click',
          'phone_click': 'Phone Call Click',
          'email_click': 'Email Click',
          'form_submit': 'Form Submission',
          'button_click': 'Button Click',
          'purchase': 'Purchase',
          'add_to_cart': 'Add to Cart',
          'begin_checkout': 'Begin Checkout'
        };
        conversionName = eventTypeMap[conv.event_type] || conv.event_type;
      }

      return [
        conv.gclid,
        conversionName,
        conversionTime,
        conv.conversion_value || 0,
        'BRL'
      ];
    });

    // Build CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="google-ads-conversions-${siteId}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[export-google-ads] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
