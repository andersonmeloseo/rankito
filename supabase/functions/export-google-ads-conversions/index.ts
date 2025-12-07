import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA256 hash function for Enhanced Conversions
async function sha256Hash(value: string): Promise<string> {
  const normalized = value.toLowerCase().trim();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate if a string is a valid SHA256 hash (64 hex characters)
function isValidSha256(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

// Format date for Google Ads (yyyy-MM-dd HH:mm:ss timezone)
function formatGoogleAdsDate(isoDate: string, timezone: string = 'America/Sao_Paulo'): string {
  const date = new Date(isoDate);
  
  // Format: "2024-12-06 15:30:00 America/Sao_Paulo"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezone}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { siteId, startDate, endDate, goalIds, timezone = 'America/Sao_Paulo', currency = 'BRL' } = await req.json();

    if (!siteId) {
      return new Response(
        JSON.stringify({ error: 'siteId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[export-google-ads] Exporting conversions for site ${siteId}`);

    // Build query for REAL conversions with gclid (exclude page_view and page_exit)
    let query = supabase
      .from('rank_rent_conversions')
      .select('id, created_at, event_type, gclid, conversion_value, cta_text, page_url, email_hash, phone_hash, goal_id')
      .eq('site_id', siteId)
      .not('gclid', 'is', null)
      .not('event_type', 'eq', 'page_view')
      .not('event_type', 'eq', 'page_exit')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (goalIds && goalIds.length > 0) {
      query = query.in('goal_id', goalIds);
    }

    const { data: conversions, error } = await query;

    if (error) {
      console.error('[export-google-ads] Query error:', error);
      throw error;
    }

    console.log(`[export-google-ads] Found ${conversions?.length || 0} real conversions with gclid`);

    // Fetch goal names AND values for custom conversion names and values
    let goalData: Record<string, { name: string; value: number | null }> = {};
    if (conversions && conversions.length > 0) {
      const uniqueGoalIds = [...new Set(conversions.map(c => c.goal_id).filter(Boolean))];
      if (uniqueGoalIds.length > 0) {
        const { data: goals } = await supabase
          .from('conversion_goals')
          .select('id, goal_name, conversion_value')
          .in('id', uniqueGoalIds);
        
        if (goals) {
          goalData = Object.fromEntries(goals.map(g => [g.id, { name: g.goal_name, value: g.conversion_value }]));
        }
      }
    }

    // Default conversion values by event type (in BRL)
    const defaultValueByType: Record<string, number> = {
      'whatsapp_click': 25,
      'phone_click': 25,
      'email_click': 15,
      'form_submit': 50,
      'button_click': 10,
      'purchase': 100,
      'add_to_cart': 20,
      'begin_checkout': 30
    };

    // Generate CSV in Google Ads Enhanced Conversions for Leads format
    // Official template: exactly 7 columns
    const csvHeaders = [
      'Google Click ID',
      'Conversion Name', 
      'Conversion Time',
      'Conversion Value',
      'Conversion Currency',
      'Email',
      'Phone Number'
    ];

    // Process conversions with async hashing for Enhanced Conversions
    const csvRows = await Promise.all((conversions || []).map(async (conv) => {
      // Format timestamp for Google Ads with timezone
      const conversionTime = formatGoogleAdsDate(conv.created_at, timezone);
      
      // Determine conversion name from goal or event type
      let conversionName = 'Rankito Conversion';
      if (conv.goal_id && goalData[conv.goal_id]) {
        conversionName = goalData[conv.goal_id].name;
      } else if (conv.event_type) {
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

      // Determine conversion value: priority is conv.conversion_value > goal value > default by type
      const conversionValue = conv.conversion_value 
        || (conv.goal_id && goalData[conv.goal_id]?.value) 
        || defaultValueByType[conv.event_type] 
        || 0;

      // Hash email for Enhanced Conversions (if available)
      let emailHash = '';
      if (conv.email_hash) {
        if (isValidSha256(conv.email_hash)) {
          emailHash = conv.email_hash;
        } else {
          emailHash = await sha256Hash(conv.email_hash);
        }
      }

      // Hash phone for Enhanced Conversions (if available)
      let phoneHash = '';
      if (conv.phone_hash) {
        if (isValidSha256(conv.phone_hash)) {
          phoneHash = conv.phone_hash;
        } else {
          phoneHash = await sha256Hash(conv.phone_hash);
        }
      }

      return [
        conv.gclid,                           // Google Click ID
        conversionName,                       // Conversion Name
        conversionTime,                       // Conversion Time
        conversionValue,                      // Conversion Value (from goal or default)
        currency,                             // Conversion Currency
        emailHash,                            // Email (SHA256 hashed)
        phoneHash                             // Phone Number (SHA256 hashed)
      ];
    }));

    // Build CSV string with Parameters line for timezone
    const csvContent = [
      `Parameters:TimeZone=${timezone}`,
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
