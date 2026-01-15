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
const UA_WEIGHTS = [35, 15, 10, 25, 15, 5];

// Cidades de Connecticut com coordenadas aproximadas
const CT_CITIES = [
  { name: "New Milford", lat: 41.5773, lng: -73.4087 },
  { name: "Danbury", lat: 41.3948, lng: -73.4540 },
  { name: "Stamford", lat: 41.0534, lng: -73.5387 },
  { name: "Greenwich", lat: 41.0263, lng: -73.6285 },
  { name: "Sherman", lat: 41.5795, lng: -73.4968 },
  { name: "Brookfield", lat: 41.4648, lng: -73.4007 },
  { name: "Bethel", lat: 41.3712, lng: -73.4140 },
  { name: "Ridgefield", lat: 41.2815, lng: -73.4982 },
  { name: "Fairfield", lat: 41.1411, lng: -73.2637 },
  { name: "Westport", lat: 41.1415, lng: -73.3579 },
  { name: "Norwalk", lat: 41.1176, lng: -73.4078 },
  { name: "Wilton", lat: 41.1953, lng: -73.4379 },
  { name: "New Canaan", lat: 41.1468, lng: -73.4948 },
  { name: "Darien", lat: 41.0787, lng: -73.4693 },
  { name: "Trumbull", lat: 41.2429, lng: -73.2007 },
];

// Referrers
const REFERRERS = [
  { url: "https://www.google.com/", weight: 60 },
  { url: "https://www.bing.com/", weight: 15 },
  { url: "", weight: 25 },
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

// Gerar IP aleatório realista (range de IPs residenciais dos EUA)
function generateRandomIP(): string {
  // Ranges de IP residenciais comuns nos EUA
  const ranges = [
    // Comcast
    { start: [24, 0], end: [24, 255] },
    { start: [50, 128], end: [50, 255] },
    { start: [68, 32], end: [68, 63] },
    { start: [71, 56], end: [71, 127] },
    { start: [73, 0], end: [73, 127] },
    { start: [75, 64], end: [75, 127] },
    { start: [76, 96], end: [76, 127] },
    // AT&T
    { start: [32, 128], end: [32, 191] },
    { start: [66, 160], end: [66, 191] },
    { start: [99, 64], end: [99, 127] },
    { start: [107, 128], end: [107, 191] },
    // Verizon
    { start: [71, 160], end: [71, 191] },
    { start: [72, 64], end: [72, 95] },
    { start: [98, 192], end: [98, 255] },
    // Spectrum
    { start: [65, 24], end: [65, 31] },
    { start: [67, 160], end: [67, 191] },
    { start: [69, 112], end: [69, 127] },
    // Frontier
    { start: [74, 40], end: [74, 47] },
    { start: [75, 48], end: [75, 55] },
  ];
  
  const range = ranges[Math.floor(Math.random() * ranges.length)];
  const octet1 = range.start[0];
  const octet2 = range.start[1] + Math.floor(Math.random() * (range.end[1] - range.start[1] + 1));
  const octet3 = Math.floor(Math.random() * 256);
  const octet4 = Math.floor(Math.random() * 254) + 1; // Evitar .0 e .255
  
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

// Pool de visitantes únicos (simular ~120-150 visitantes únicos)
function generateVisitorPool(count: number): Array<{ ip: string; city: typeof CT_CITIES[0]; ua: typeof USER_AGENTS[0] }> {
  const visitors: Array<{ ip: string; city: typeof CT_CITIES[0]; ua: typeof USER_AGENTS[0] }> = [];
  
  for (let i = 0; i < count; i++) {
    visitors.push({
      ip: generateRandomIP(),
      city: CT_CITIES[Math.floor(Math.random() * CT_CITIES.length)],
      ua: weightedRandom(USER_AGENTS, UA_WEIGHTS),
    });
  }
  
  return visitors;
}

// Gerar data aleatória no período com distribuição natural NÃO UNIFORME
function generateRandomDate(dayIndex: number, totalDays: number): Date {
  const startTime = START_DATE.getTime();
  const currentDate = new Date(startTime + dayIndex * 24 * 60 * 60 * 1000);
  
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
  
  currentDate.setHours(hour, minute, second, Math.floor(Math.random() * 1000));
  
  return currentDate;
}

// Calcular peso do dia (para distribuição não uniforme)
function getDayWeight(dayIndex: number): number {
  const startTime = START_DATE.getTime();
  const currentDate = new Date(startTime + dayIndex * 24 * 60 * 60 * 1000);
  const dayOfWeek = currentDate.getDay(); // 0 = domingo
  const dayOfMonth = currentDate.getDate();
  const month = currentDate.getMonth();
  
  let weight = 1.0;
  
  // Fim de semana: menos peso
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    weight *= 0.4;
  }
  
  // Natal (25/12): muito menos
  if (month === 11 && dayOfMonth === 25) {
    weight *= 0.05;
  }
  
  // Véspera e dia depois do Natal
  if (month === 11 && (dayOfMonth === 24 || dayOfMonth === 26)) {
    weight *= 0.2;
  }
  
  // Ano Novo (01/01): muito menos
  if (month === 0 && dayOfMonth === 1) {
    weight *= 0.05;
  }
  
  // Véspera do Ano Novo
  if (month === 11 && dayOfMonth === 31) {
    weight *= 0.15;
  }
  
  // 2 de janeiro (recuperação lenta)
  if (month === 0 && dayOfMonth === 2) {
    weight *= 0.3;
  }
  
  // Janeiro tem mais peso (retomada) - dias após 5 de janeiro
  if (month === 0 && dayOfMonth > 5) {
    weight *= 1.4;
  }
  
  // Segundas-feiras têm um pouco mais de peso
  if (dayOfWeek === 1) {
    weight *= 1.15;
  }
  
  // Quartas e quintas também são fortes
  if (dayOfWeek === 3 || dayOfWeek === 4) {
    weight *= 1.1;
  }
  
  return weight;
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

    // 1. Buscar páginas existentes do site para mapear page_id
    const { data: existingPages, error: pagesError } = await supabase
      .from('rank_rent_pages')
      .select('id, page_path')
      .eq('site_id', SITE_ID);

    if (pagesError) {
      console.error("Erro ao buscar páginas:", pagesError);
      throw pagesError;
    }

    // Criar mapa de path -> page_id (normalizado)
    const pagePathToId = new Map<string, string>();
    if (existingPages) {
      for (const page of existingPages) {
        const normalizedPath = page.page_path.replace(/\/$/, ''); // remove trailing slash
        pagePathToId.set(normalizedPath, page.id);
        pagePathToId.set(normalizedPath + '/', page.id); // também com slash
        pagePathToId.set(page.page_path, page.id); // path original
      }
    }
    console.log(`📑 Mapeadas ${existingPages?.length || 0} páginas para page_id`);

    // 2. Limpar dados existentes do período para este site
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

    // 3. Gerar pool de visitantes únicos (~130 visitantes)
    const visitorPool = generateVisitorPool(130);
    console.log(`👥 Pool de ${visitorPool.length} visitantes únicos gerado`);
    
    // Função auxiliar para buscar page_id
    const getPageId = (pagePath: string): string | null => {
      return pagePathToId.get(pagePath) || 
             pagePathToId.get(pagePath.replace(/\/$/, '')) || 
             pagePathToId.get(pagePath.replace(/\/$/, '') + '/') || 
             null;
    };

    // 3. Calcular distribuição de page views por dia
    const totalDays = 23;
    const dayWeights: number[] = [];
    
    for (let d = 0; d < totalDays; d++) {
      dayWeights.push(getDayWeight(d));
    }
    
    const totalWeight = dayWeights.reduce((a, b) => a + b, 0);
    const totalPageViews = PAGES_DISTRIBUTION.reduce((sum, p) => sum + p.views, 0);
    
    // Distribuir page views por dia baseado nos pesos
    const pageViewsPerDay: number[] = dayWeights.map(w => 
      Math.round((w / totalWeight) * totalPageViews)
    );
    
    // Ajustar para garantir o total correto
    const currentTotal = pageViewsPerDay.reduce((a, b) => a + b, 0);
    const diff = totalPageViews - currentTotal;
    
    // Adicionar diferença em dias aleatórios com peso alto
    for (let i = 0; i < Math.abs(diff); i++) {
      const dayIndex = weightedRandom(
        Array.from({ length: totalDays }, (_, i) => i),
        dayWeights
      );
      pageViewsPerDay[dayIndex] += diff > 0 ? 1 : -1;
    }
    
    console.log("📅 Distribuição de page views por dia:", pageViewsPerDay);

    // 4. Gerar Page Views
    const pageViewRecords: any[] = [];
    const visitorDaySessions = new Map<string, string>(); // visitor-day -> session
    
    // Criar pool de páginas com base na distribuição
    const pagePool: string[] = [];
    for (const page of PAGES_DISTRIBUTION) {
      for (let i = 0; i < page.views; i++) {
        pagePool.push(page.path);
      }
    }
    
    // Shuffle do pool
    for (let i = pagePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pagePool[i], pagePool[j]] = [pagePool[j], pagePool[i]];
    }
    
    let pagePoolIndex = 0;
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const viewsThisDay = pageViewsPerDay[dayIndex];
      
      // Quantos visitantes únicos neste dia? (entre 30-70% do pool baseado no peso)
      const dayWeight = dayWeights[dayIndex];
      const maxVisitorsRatio = 0.3 + (dayWeight / Math.max(...dayWeights)) * 0.4;
      const visitorsThisDay = Math.min(
        Math.ceil(viewsThisDay * 0.7), // Máximo 70% das views são de visitantes únicos
        Math.ceil(visitorPool.length * maxVisitorsRatio)
      );
      
      // Selecionar visitantes para este dia
      const shuffledVisitors = [...visitorPool].sort(() => Math.random() - 0.5);
      const todayVisitors = shuffledVisitors.slice(0, visitorsThisDay);
      
      // Distribuir views entre os visitantes do dia
      let viewsDistributed = 0;
      
      for (const visitor of todayVisitors) {
        if (viewsDistributed >= viewsThisDay) break;
        
        // Quantas páginas este visitante vai ver? (1-5, com peso para 1-2)
        const pagesForVisitor = weightedRandom([1, 2, 3, 4, 5], [40, 30, 15, 10, 5]);
        const sessionId = generateSessionId();
        const sessionKey = `${visitor.ip}-${dayIndex}`;
        visitorDaySessions.set(sessionKey, sessionId);
        
        for (let p = 0; p < pagesForVisitor && viewsDistributed < viewsThisDay; p++) {
          if (pagePoolIndex >= pagePool.length) break;
          
          const pagePath = pagePool[pagePoolIndex++];
          const date = generateRandomDate(dayIndex, totalDays);
          const referrer = p === 0 ? getRandomReferrer() : ""; // Só primeira página tem referrer
          
          pageViewRecords.push({
            site_id: SITE_ID,
            page_id: getPageId(pagePath),
            page_url: `${SITE_URL}${pagePath}`,
            page_path: pagePath,
            event_type: "page_view",
            user_agent: visitor.ua.ua,
            referrer: referrer,
            ip_address: visitor.ip,
            city: visitor.city.name,
            region: "Connecticut",
            country: "United States",
            country_code: "US",
            session_id: sessionId,
            created_at: date.toISOString(),
            metadata: {
              device: visitor.ua.device,
              browser: visitor.ua.browser,
              os: visitor.ua.os
            }
          });
          
          viewsDistributed++;
        }
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

    // 5. Gerar Phone Clicks (conversões) - ~40 total
    const phoneClickRecords: any[] = [];
    const numPhoneClicks = 38 + Math.floor(Math.random() * 7);

    // Distribuir conversões por dia (concentrar em dias com mais tráfego)
    const conversionsPerDay: number[] = dayWeights.map((w, i) => {
      // Apenas dias com peso > 0.3 têm conversões
      if (w < 0.3) return 0;
      return Math.round((w / totalWeight) * numPhoneClicks);
    });
    
    // Ajustar total
    const currentConvTotal = conversionsPerDay.reduce((a, b) => a + b, 0);
    const convDiff = numPhoneClicks - currentConvTotal;
    
    for (let i = 0; i < Math.abs(convDiff); i++) {
      const dayIndex = weightedRandom(
        Array.from({ length: totalDays }, (_, i) => i),
        dayWeights.map(w => w > 0.3 ? w : 0) // Só adicionar em dias válidos
      );
      conversionsPerDay[dayIndex] += convDiff > 0 ? 1 : -1;
    }

    // Páginas para phone clicks
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

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const conversionsThisDay = conversionsPerDay[dayIndex];
      if (conversionsThisDay <= 0) continue;
      
      for (let c = 0; c < conversionsThisDay; c++) {
        // Pegar um visitante aleatório do pool
        const visitor = visitorPool[Math.floor(Math.random() * visitorPool.length)];
        const date = generateRandomDate(dayIndex, totalDays);
        
        const pagePath = weightedRandom(
          phoneClickPages.map(p => p.path),
          phoneClickPages.map(p => p.weight)
        );

        phoneClickRecords.push({
          site_id: SITE_ID,
          page_id: getPageId(pagePath),
          page_url: `${SITE_URL}${pagePath}`,
          page_path: pagePath,
          event_type: "phone_click",
          cta_text: PHONE_CTA,
          user_agent: visitor.ua.ua,
          ip_address: visitor.ip,
          city: visitor.city.name,
          region: "Connecticut",
          country: "United States",
          country_code: "US",
          session_id: generateSessionId(),
          created_at: date.toISOString(),
          metadata: {
            device: visitor.ua.device,
            browser: visitor.ua.browser,
            os: visitor.ua.os,
            platform: "gtm",
            phone: PHONE_CTA,
            cta_text: PHONE_CTA
          }
        });
      }
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

    // 6. Gerar alguns Page Exits
    const pageExitRecords: any[] = [];
    const numPageExits = Math.floor(pageViewRecords.length * 0.35);

    for (let i = 0; i < numPageExits; i++) {
      const dayIndex = weightedRandom(
        Array.from({ length: totalDays }, (_, i) => i),
        dayWeights
      );
      
      const visitor = visitorPool[Math.floor(Math.random() * visitorPool.length)];
      const date = generateRandomDate(dayIndex, totalDays);
      
      const page = weightedRandom(
        PAGES_DISTRIBUTION.map(p => p.path),
        PAGES_DISTRIBUTION.map(p => p.views)
      );

      pageExitRecords.push({
        site_id: SITE_ID,
        page_id: getPageId(page),
        page_url: `${SITE_URL}${page}`,
        page_path: page,
        event_type: "page_exit",
        user_agent: visitor.ua.ua,
        ip_address: visitor.ip,
        city: visitor.city.name,
        region: "Connecticut",
        country: "United States",
        country_code: "US",
        session_id: generateSessionId(),
        created_at: date.toISOString(),
        metadata: {
          device: visitor.ua.device,
          browser: visitor.ua.browser,
          os: visitor.ua.os,
          time_on_page: Math.floor(Math.random() * 180) + 10,
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

    // Contar visitantes únicos reais
    const uniqueIPs = new Set(pageViewRecords.map(r => r.ip_address));

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
      unique_visitors: uniqueIPs.size,
      phone_cta: PHONE_CTA,
      distribution_per_day: pageViewsPerDay
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
