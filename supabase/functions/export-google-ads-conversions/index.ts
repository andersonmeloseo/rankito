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

    // Build query for conversions with gclid - include email_hash and phone_hash for Enhanced Conversions
    let query = supabase
      .from('rank_rent_conversions')
      .select('id, created_at, event_type, gclid, conversion_value, cta_text, page_url, email_hash, phone_hash, goal_id')
      .eq('site_id', siteId)
      .not('gclid', 'is', null)
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

    console.log(`[export-google-ads] Found ${conversions?.length || 0} conversions with gclid`);

    // Fetch goal names for custom conversion names
    let goalNames: Record<string, string> = {};
    if (conversions && conversions.length > 0) {
      const uniqueGoalIds = [...new Set(conversions.map(c => c.goal_id).filter(Boolean))];
      if (uniqueGoalIds.length > 0) {
        const { data: goals } = await supabase
          .from('conversion_goals')
          .select('id, goal_name')
          .in('id', uniqueGoalIds);
        
        if (goals) {
          goalNames = Object.fromEntries(goals.map(g => [g.id, g.goal_name]));
        }
      }
    }

    // Generate CSV in Google Ads Enhanced Conversions for Leads format
    // Required columns + Optional Enhanced Conversions fields
    const csvHeaders = [
      'Google Click ID',
      'Conversion Name', 
      'Conversion Time',
      'Conversion Value',
      'Conversion Currency',
      'Order ID',
      'Email',
      'Phone Number',
      'Ad User Data',
      'Ad Personalization'
    ];

    // Process conversions with async hashing for Enhanced Conversions
    const csvRows = await Promise.all((conversions || []).map(async (conv) => {
      // Format timestamp for Google Ads with timezone
      const conversionTime = formatGoogleAdsDate(conv.created_at, timezone);
      
      // Determine conversion name from goal or event type
      let conversionName = 'Rankito Conversion';
      if (conv.goal_id && goalNames[conv.goal_id]) {
        conversionName = goalNames[conv.goal_id];
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

      // Hash email for Enhanced Conversions (if available)
      let emailHash = '';
      if (conv.email_hash) {
        if (isValidSha256(conv.email_hash)) {
          emailHash = conv.email_hash;
        } else {
          // Hash if it's plain text email
          emailHash = await sha256Hash(conv.email_hash);
        }
      }

      // Hash phone for Enhanced Conversions (if available)
      let phoneHash = '';
      if (conv.phone_hash) {
        if (isValidSha256(conv.phone_hash)) {
          phoneHash = conv.phone_hash;
        } else {
          // Hash if it's plain text phone
          phoneHash = await sha256Hash(conv.phone_hash);
        }
      }

      return [
        conv.gclid,                           // Google Click ID
        conversionName,                       // Conversion Name
        conversionTime,                       // Conversion Time
        conv.conversion_value || 0,           // Conversion Value
        currency,                             // Conversion Currency
        conv.id,                              // Order ID (unique identifier for deduplication)
        emailHash,                            // Email (SHA256 hashed)
        phoneHash,                            // Phone Number (SHA256 hashed)
        'Granted',                            // Ad User Data consent (LGPD/GDPR)
        'Granted'                             // Ad Personalization consent (LGPD/GDPR)
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
