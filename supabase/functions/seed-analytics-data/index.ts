import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Site específico: Claudio Tree Work
const SITE_ID = "b8853308-0946-451f-8cf0-7264bd823e20";
const SITE_URL = "https://claudiotreework.com";
const PHONE_CTA = "(203) 297-3522";

// Período: 23 de dezembro de 2025 a 14 de janeiro de 2026
const START_DATE = new Date("2025-12-23T00:00:00-05:00");
const END_DATE = new Date("2026-01-14T23:59:59-05:00");

// User Agents realistas
const USER_AGENTS = [
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", device: "desktop", browser: "Chrome", os: "Windows" },
  { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15", device: "desktop", browser: "Safari", os: "Mac" },
  { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", device: "desktop", browser: "Chrome", os: "Mac" },
  { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1", device: "mobile", browser: "Safari", os: "iOS" },
  { ua: "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36", device: "mobile", browser: "Chrome", os: "Android" },
  { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0", device: "desktop", browser: "Firefox", os: "Windows" },
];

// Distribuição de User Agents (peso)
const UA_WEIGHTS = [35, 15, 10, 25, 15, 5]; // Total 105, normalizar

// Cidades de Connecticut
const CT_CITIES = [
  "New Milford", "Danbury", "Stamford", "Greenwich", "Sherman",
  "Brookfield", "Bethel", "Ridgefield", "Fairfield", "Westport",
  "Norwalk", "Wilton", "New Canaan", "Darien", "Trumbull"
];

// Referrers
const REFERRERS = [
  { url: "https://www.google.com/", weight: 60 },
  { url: "https://www.bing.com/", weight: 15 },
  { url: "", weight: 25 }, // direct
];

// Páginas baseadas no Clarity com distribuição de views
const PAGES_DISTRIBUTION = [
  { path: "/", views: 148 },
  { path: "/request-an-estimate/", views: 21 },
  { path: "/blog/", views: 19 },
  { path: "/stump-grinding-sherman-ct/", views: 14 },
  { path: "/tree-removal-services/", views: 14 },
  { path: "/tree-pruning-services/", views: 13 },
  { path: "/about/", views: 9 },
  { path: "/stump-grinding-danbury-ct/", views: 8 },
  { path: "/tree-pruning-fairfield-county-ct/", views: 8 },
  { path: "/tree-removal-sherman-ct/", views: 7 },
  { path: "/land-clearing-services/", views: 5 },
  { path: "/tree-removal-danbury-ct/", views: 5 },
  { path: "/tree-pruning-greenwich-ct/", views: 4 },
  { path: "/stump-grinding-new-milford-ct/", views: 4 },
  { path: "/tree-removal-new-milford-ct/", views: 4 },
  { path: "/tree-trimming-services/", views: 4 },
  { path: "/emergency-tree-services/", views: 4 },
  { path: "/tree-pruning-stamford-ct/", views: 3 },
  { path: "/tree-removal-greenwich-ct/", views: 3 },
  { path: "/tree-removal-stamford-ct/", views: 3 },
  { path: "/stump-grinding-greenwich-ct/", views: 3 },
  { path: "/stump-grinding-stamford-ct/", views: 3 },
  { path: "/tree-pruning-danbury-ct/", views: 3 },
  { path: "/tree-pruning-new-milford-ct/", views: 3 },
  { path: "/land-clearing-danbury-ct/", views: 2 },
  { path: "/land-clearing-new-milford-ct/", views: 2 },
  { path: "/land-clearing-sherman-ct/", views: 2 },
  { path: "/land-clearing-greenwich-ct/", views: 2 },
  { path: "/land-clearing-stamford-ct/", views: 2 },
  { path: "/tree-pruning-sherman-ct/", views: 2 },
  { path: "/contact/", views: 2 },
  { path: "/services/", views: 2 },
  { path: "/blog/tree-care-tips/", views: 2 },
  { path: "/blog/when-to-remove-tree/", views: 2 },
  { path: "/blog/stump-grinding-benefits/", views: 1 },
  { path: "/blog/land-clearing-guide/", views: 1 },
  { path: "/tree-removal-westport-ct/", views: 1 },
  { path: "/tree-removal-norwalk-ct/", views: 1 },
  { path: "/tree-removal-ridgefield-ct/", views: 1 },
  { path: "/tree-removal-brookfield-ct/", views: 1 },
  { path: "/tree-removal-bethel-ct/", views: 1 },
  { path: "/stump-grinding-westport-ct/", views: 1 },
  { path: "/stump-grinding-norwalk-ct/", views: 1 },
  { path: "/stump-grinding-ridgefield-ct/", views: 1 },
  { path: "/stump-grinding-brookfield-ct/", views: 1 },
  { path: "/stump-grinding-bethel-ct/", views: 1 },
  { path: "/tree-pruning-westport-ct/", views: 1 },
  { path: "/tree-pruning-norwalk-ct/", views: 1 },
  { path: "/tree-pruning-ridgefield-ct/", views: 1 },
  { path: "/tree-pruning-brookfield-ct/", views: 1 },
  { path: "/tree-pruning-bethel-ct/", views: 1 },
  { path: "/faq/", views: 1 },
  { path: "/gallery/", views: 1 },
  { path: "/testimonials/", views: 1 },
];

// Função para escolher item com peso
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Gerar data aleatória no período com distribuição natural
function generateRandomDate(): Date {
  const totalDays = 23; // 23 dias no período
  
  // Peso por dia (menos no Natal e Ano Novo)
  const dayWeights: number[] = [];
  const startTime = START_DATE.getTime();
  
  for (let d = 0; d < totalDays; d++) {
    const currentDate = new Date(startTime + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = currentDate.getDay(); // 0 = domingo
    const dayOfMonth = currentDate.getDate();
    const month = currentDate.getMonth();
    
    let weight = 1.0;
    
    // Fim de semana: menos peso
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weight *= 0.5;
    }
    
    // Natal (25/12): muito menos
    if (month === 11 && dayOfMonth === 25) {
      weight *= 0.1;
    }
    
    // Véspera e dia depois do Natal
    if (month === 11 && (dayOfMonth === 24 || dayOfMonth === 26)) {
      weight *= 0.3;
    }
    
    // Ano Novo (01/01): muito menos
    if (month === 0 && dayOfMonth === 1) {
      weight *= 0.1;
    }
    
    // Véspera do Ano Novo
    if (month === 11 && dayOfMonth === 31) {
      weight *= 0.2;
    }
    
    // Janeiro tem mais peso (retomada)
    if (month === 0 && dayOfMonth > 2) {
      weight *= 1.3;
    }
    
    dayWeights.push(weight);
  }
  
  // Escolher dia
  const dayIndex = weightedRandom(
    Array.from({ length: totalDays }, (_, i) => i),
    dayWeights
  );
  
  const chosenDay = new Date(startTime + dayIndex * 24 * 60 * 60 * 1000);
  
  // Gerar hora (mais peso em horário comercial 9h-18h)
  const hourWeights = [
    0.1, 0.05, 0.02, 0.02, 0.02, 0.05, // 0-5h
    0.1, 0.3, 0.6, 1.0, 1.0, 1.0, // 6-11h
    0.8, 1.0, 1.0, 1.0, 1.0, 0.8, // 12-17h
    0.6, 0.5, 0.4, 0.3, 0.2, 0.15 // 18-23h
  ];
  
  const hour = weightedRandom(
    Array.from({ length: 24 }, (_, i) => i),
    hourWeights
  );
  
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  chosenDay.setHours(hour, minute, second, Math.floor(Math.random() * 1000));
  
  return chosenDay;
}

// Gerar User Agent aleatório
function getRandomUserAgent() {
  return weightedRandom(USER_AGENTS, UA_WEIGHTS);
}

// Gerar cidade aleatória
function getRandomCity(): string {
  return CT_CITIES[Math.floor(Math.random() * CT_CITIES.length)];
}

// Gerar referrer aleatório
function getRandomReferrer(): string {
  return weightedRandom(
    REFERRERS.map(r => r.url),
    REFERRERS.map(r => r.weight)
  );
}

// Gerar session_id único
function generateSessionId(): string {
  return crypto.randomUUID();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🌱 Iniciando seed de dados para Claudio Tree Work...");
    console.log(`📅 Período: ${START_DATE.toISOString()} a ${END_DATE.toISOString()}`);

    // 1. Limpar dados existentes do período para este site
    const { error: deleteError } = await supabase
      .from('rank_rent_conversions')
      .delete()
      .eq('site_id', SITE_ID)
      .gte('created_at', START_DATE.toISOString())
      .lte('created_at', END_DATE.toISOString());

    if (deleteError) {
      console.error("Erro ao limpar dados:", deleteError);
      throw deleteError;
    }
    console.log("🧹 Dados existentes do período removidos");

    // 2. Gerar Page Views
    const pageViewRecords: any[] = [];
    const sessionMap = new Map<string, string>(); // Para manter sessões consistentes

    for (const page of PAGES_DISTRIBUTION) {
      for (let i = 0; i < page.views; i++) {
        const ua = getRandomUserAgent();
        const date = generateRandomDate();
        const city = getRandomCity();
        const referrer = getRandomReferrer();
        
        // Criar ou reutilizar session (30% chance de reutilizar)
        let sessionId: string;
        const sessionKey = `${ua.ua}-${city}-${date.toDateString()}`;
        
        if (sessionMap.has(sessionKey) && Math.random() < 0.3) {
          sessionId = sessionMap.get(sessionKey)!;
        } else {
          sessionId = generateSessionId();
          sessionMap.set(sessionKey, sessionId);
        }

        pageViewRecords.push({
          site_id: SITE_ID,
          page_url: `${SITE_URL}${page.path}`,
          page_path: page.path,
          event_type: "page_view",
          user_agent: ua.ua,
          referrer: referrer,
          city: city,
          region: "Connecticut",
          country: "United States",
          country_code: "US",
          session_id: sessionId,
          created_at: date.toISOString(),
          metadata: {
            device: ua.device,
            browser: ua.browser,
            os: ua.os
          }
        });
      }
    }

    console.log(`📄 Gerando ${pageViewRecords.length} page views...`);

    // Inserir page views em lotes de 100
    for (let i = 0; i < pageViewRecords.length; i += 100) {
      const batch = pageViewRecords.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from('rank_rent_conversions')
        .insert(batch);

      if (insertError) {
        console.error(`Erro ao inserir page views (lote ${i / 100 + 1}):`, insertError);
        throw insertError;
      }
    }
    console.log("✅ Page views inseridos com sucesso");

    // 3. Gerar Phone Clicks (conversões)
    const phoneClickRecords: any[] = [];
    const numPhoneClicks = 38 + Math.floor(Math.random() * 7); // 38-44 conversões

    // Distribuição de páginas para phone clicks
    // 60% homepage, 25% serviços, 15% outras
    const phoneClickPages = [
      { path: "/", weight: 60 },
      { path: "/tree-removal-services/", weight: 8 },
      { path: "/tree-pruning-services/", weight: 6 },
      { path: "/stump-grinding-sherman-ct/", weight: 4 },
      { path: "/land-clearing-services/", weight: 4 },
      { path: "/request-an-estimate/", weight: 8 },
      { path: "/about/", weight: 3 },
      { path: "/emergency-tree-services/", weight: 4 },
      { path: "/tree-removal-danbury-ct/", weight: 3 },
    ];

    for (let i = 0; i < numPhoneClicks; i++) {
      const ua = getRandomUserAgent();
      const date = generateRandomDate();
      const city = getRandomCity();
      
      const pagePath = weightedRandom(
        phoneClickPages.map(p => p.path),
        phoneClickPages.map(p => p.weight)
      );

      phoneClickRecords.push({
        site_id: SITE_ID,
        page_url: `${SITE_URL}${pagePath}`,
        page_path: pagePath,
        event_type: "phone_click",
        cta_text: PHONE_CTA,
        user_agent: ua.ua,
        city: city,
        region: "Connecticut",
        country: "United States",
        country_code: "US",
        session_id: generateSessionId(),
        created_at: date.toISOString(),
        metadata: {
          device: ua.device,
          browser: ua.browser,
          os: ua.os,
          platform: "gtm",
          phone: PHONE_CTA,
          cta_text: PHONE_CTA
        }
      });
    }

    console.log(`📞 Gerando ${phoneClickRecords.length} phone clicks...`);

    // Inserir phone clicks
    const { error: phoneInsertError } = await supabase
      .from('rank_rent_conversions')
      .insert(phoneClickRecords);

    if (phoneInsertError) {
      console.error("Erro ao inserir phone clicks:", phoneInsertError);
      throw phoneInsertError;
    }
    console.log("✅ Phone clicks inseridos com sucesso");

    // 4. Gerar alguns Page Exits (para parecer natural)
    const pageExitRecords: any[] = [];
    const numPageExits = Math.floor(pageViewRecords.length * 0.4); // 40% das page views

    for (let i = 0; i < numPageExits; i++) {
      const ua = getRandomUserAgent();
      const date = generateRandomDate();
      const city = getRandomCity();
      
      const page = weightedRandom(
        PAGES_DISTRIBUTION.map(p => p.path),
        PAGES_DISTRIBUTION.map(p => p.views)
      );

      pageExitRecords.push({
        site_id: SITE_ID,
        page_url: `${SITE_URL}${page}`,
        page_path: page,
        event_type: "page_exit",
        user_agent: ua.ua,
        city: city,
        region: "Connecticut",
        country: "United States",
        country_code: "US",
        session_id: generateSessionId(),
        created_at: date.toISOString(),
        metadata: {
          device: ua.device,
          browser: ua.browser,
          os: ua.os,
          time_on_page: Math.floor(Math.random() * 180) + 10, // 10-190 segundos
          scroll_depth: Math.floor(Math.random() * 100)
        }
      });
    }

    console.log(`🚪 Gerando ${pageExitRecords.length} page exits...`);

    // Inserir page exits em lotes
    for (let i = 0; i < pageExitRecords.length; i += 100) {
      const batch = pageExitRecords.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from('rank_rent_conversions')
        .insert(batch);

      if (insertError) {
        console.error(`Erro ao inserir page exits (lote ${i / 100 + 1}):`, insertError);
        throw insertError;
      }
    }
    console.log("✅ Page exits inseridos com sucesso");

    // Resumo
    const summary = {
      site_id: SITE_ID,
      period: {
        start: START_DATE.toISOString(),
        end: END_DATE.toISOString()
      },
      records_created: {
        page_views: pageViewRecords.length,
        phone_clicks: phoneClickRecords.length,
        page_exits: pageExitRecords.length,
        total: pageViewRecords.length + phoneClickRecords.length + pageExitRecords.length
      },
      phone_cta: PHONE_CTA
    };

    console.log("🎉 Seed concluído com sucesso!", summary);

    return new Response(JSON.stringify({
      success: true,
      message: "Dados inseridos com sucesso",
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ Erro no seed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
