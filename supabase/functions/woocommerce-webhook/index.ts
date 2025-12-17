import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-wc-webhook-signature, x-wc-webhook-topic, x-wc-webhook-source",
};

interface WooCommerceLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  sku: string;
  price: number;
}

interface WooCommerceBilling {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
}

interface WooCommerceOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  payment_method: string;
  payment_method_title: string;
  date_created: string;
  date_paid: string | null;
  customer_id: number;
  billing: WooCommerceBilling;
  line_items: WooCommerceLineItem[];
  coupon_lines: Array<{ code: string; discount: string }>;
  meta_data: Array<{ key: string; value: string }>;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const siteToken = url.searchParams.get("site_token");
    const webhookSecret = url.searchParams.get("secret");

    console.log("🛒 WooCommerce webhook received");
    console.log("📍 Site token:", siteToken ? "present" : "missing");

    if (!siteToken) {
      console.error("❌ Missing site_token parameter");
      return new Response(
        JSON.stringify({ error: "Missing site_token parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse webhook body
    const body = await req.text();
    console.log("📦 Webhook body length:", body.length);

    // WooCommerce sends test pings with empty body or "webhook_id" only
    if (!body || body.length < 10) {
      console.log("✅ WooCommerce webhook ping received (empty body)");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook endpoint active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let order: WooCommerceOrder;
    try {
      order = JSON.parse(body);
    } catch (parseError) {
      console.error("❌ Failed to parse webhook body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a test/ping webhook
    if (!order.id && !order.status) {
      console.log("✅ WooCommerce test webhook received");
      return new Response(
        JSON.stringify({ success: true, message: "Test webhook received" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📦 Order ID:", order.id);
    console.log("📊 Order status:", order.status);
    console.log("💰 Order total:", order.total, order.currency);
    console.log("💳 Payment method:", order.payment_method_title || order.payment_method);

    // Only process orders that are paid/processing/completed
    const validStatuses = ["processing", "completed", "on-hold"];
    if (!validStatuses.includes(order.status)) {
      console.log(`⚠️ Order status "${order.status}" not tracked, skipping`);
      return new Response(
        JSON.stringify({ success: true, message: `Order status ${order.status} not tracked` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find site by tracking token
    const { data: site, error: siteError } = await supabase
      .from("rank_rent_sites")
      .select("id, site_url, site_name")
      .eq("tracking_token", siteToken)
      .single();

    if (siteError || !site) {
      console.error("❌ Site not found for token:", siteToken);
      return new Response(
        JSON.stringify({ error: "Site not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Site found:", site.site_name, site.id);

    // Check if purchase already exists for this order
    const { data: existingPurchase } = await supabase
      .from("rank_rent_conversions")
      .select("id")
      .eq("site_id", site.id)
      .eq("event_type", "purchase")
      .contains("metadata", { order_id: String(order.id) })
      .maybeSingle();

    if (existingPurchase) {
      console.log("⚠️ Purchase already exists for order:", order.id);
      return new Response(
        JSON.stringify({ success: true, message: "Purchase already tracked", order_id: order.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract product names and details
    const products = order.line_items?.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.total) / item.quantity,
      total: parseFloat(item.total),
      product_id: item.product_id,
      sku: item.sku
    })) || [];

    const productNames = products.map(p => p.name).join(", ");
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

    // Hash email and phone for privacy
    const hashData = async (data: string): Promise<string | null> => {
      if (!data) return null;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const emailHash = order.billing?.email ? await hashData(order.billing.email) : null;
    const phoneHash = order.billing?.phone ? await hashData(order.billing.phone) : null;

    // Build page URL for order confirmation (reconstructed)
    const siteBaseUrl = site.site_url.replace(/\/$/, "");
    const pageUrl = `${siteBaseUrl}/checkout/order-received/${order.id}/`;
    const pagePath = `/checkout/order-received/${order.id}/`;

    // Parse revenue
    const revenue = parseFloat(order.total) || 0;

    // Create purchase event
    const purchaseData = {
      site_id: site.id,
      page_url: pageUrl,
      page_path: pagePath,
      event_type: "purchase",
      is_ecommerce_event: true,
      conversion_value: revenue,
      metadata: {
        order_id: String(order.id),
        order_status: order.status,
        revenue,
        currency: order.currency || "BRL",
        payment_method: order.payment_method,
        payment_method_title: order.payment_method_title,
        products,
        product_names: productNames,
        total_items: totalQuantity,
        subtotal: parseFloat(order.subtotal) || 0,
        shipping: parseFloat(order.shipping_total) || 0,
        discount: parseFloat(order.discount_total) || 0,
        tax: parseFloat(order.total_tax) || 0,
        coupons: order.coupon_lines?.map(c => c.code) || [],
        customer_id: order.customer_id,
        detection_method: "woocommerce_webhook",
        date_created: order.date_created,
        date_paid: order.date_paid,
      },
      email_hash: emailHash,
      phone_hash: phoneHash,
      city: order.billing?.city || null,
      region: order.billing?.state || null,
      country: order.billing?.country || null,
      country_code: order.billing?.country || null,
      cta_text: `Compra: ${productNames}`.substring(0, 200),
    };

    console.log("📝 Creating purchase event:", {
      order_id: order.id,
      revenue,
      products: products.length,
      payment_method: order.payment_method_title
    });

    const { error: insertError } = await supabase
      .from("rank_rent_conversions")
      .insert(purchaseData);

    if (insertError) {
      console.error("❌ Error inserting purchase:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save purchase", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Purchase event created successfully for order:", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Purchase tracked successfully",
        order_id: order.id,
        revenue,
        products: products.length,
        payment_method: order.payment_method_title || order.payment_method
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
