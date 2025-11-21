import { createClient } from 'npm:@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteId, reportName, period, includeConversions, includePageViews, includeROI, includeEcommerce } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcula datas
    const endDate = new Date();
    const startDate = period === 'all' 
      ? new Date('2020-01-01')
      : new Date(endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Busca dados do site
    const { data: site } = await supabase
      .from('rank_rent_sites')
      .select('site_name, site_url')
      .eq('id', siteId)
      .single();

    // Busca conversões
    const { data: conversions } = await supabase
      .from('rank_rent_conversions')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    // Process e-commerce data
    const ecommerceEvents = conversions?.filter(c => c.is_ecommerce_event) || [];
    const purchases = ecommerceEvents.filter(e => e.event_type === 'purchase');
    const ecommerceTotalRevenue = purchases.reduce((sum, p) => sum + (parseFloat(p.metadata?.revenue || '0')), 0);
    const ecommerceTotalOrders = purchases.length;
    const ecommerceAOV = ecommerceTotalOrders > 0 ? ecommerceTotalRevenue / ecommerceTotalOrders : 0;

    // Busca métricas financeiras
    const { data: financialMetrics } = await supabase
      .from('rank_rent_financial_metrics')
      .select('*')
      .eq('site_id', siteId);

    // Busca métricas de páginas
    const { data: pageMetrics } = await supabase
      .from('rank_rent_page_metrics')
      .select('*')
      .eq('site_id', siteId)
      .order('total_conversions', { ascending: false });

    // Processa dados
    const pageViews = conversions?.filter(c => c.event_type === 'page_view') || [];
    const actualConversions = conversions?.filter(c => c.event_type !== 'page_view') || [];

    const totalConversions = actualConversions.length;
    const totalPageViews = pageViews.length;
    const conversionRate = totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0;

    // Cria workbook
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo
    const summaryData = [
      ['Relatório', reportName || `Relatório ${site?.site_name}`],
      ['Site', site?.site_name || ''],
      ['URL', site?.site_url || ''],
      ['Período', `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`],
      [''],
      ['RESUMO EXECUTIVO'],
      ['Total de Conversões', totalConversions],
      ['Total de Page Views', totalPageViews],
      ['Taxa de Conversão', `${conversionRate.toFixed(2)}%`],
    ];

    if (includeROI && financialMetrics && financialMetrics.length > 0) {
      const totalRevenue = financialMetrics.reduce((sum, m) => sum + Number(m.monthly_revenue || 0), 0);
      const totalProfit = financialMetrics.reduce((sum, m) => sum + Number(m.monthly_profit || 0), 0);
      const avgROI = financialMetrics.reduce((sum, m) => sum + Number(m.roi_percentage || 0), 0) / financialMetrics.length;
      
      summaryData.push(
        ['Receita Total', `R$ ${totalRevenue.toFixed(2)}`],
        ['Lucro Total', `R$ ${totalProfit.toFixed(2)}`],
        ['ROI Médio', `${avgROI.toFixed(2)}%`]
      );
    }

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');

    // Aba 2: Top Páginas
    if (includeConversions && pageMetrics && pageMetrics.length > 0) {
      const topPagesData = [
        ['Página', 'Conversões', 'Page Views', 'Taxa de Conversão (%)', 'Valor Mensal (R$)'],
        ...pageMetrics.slice(0, 10).map(p => [
          p.page_path || p.page_url,
          p.total_conversions || 0,
          p.total_page_views || 0,
          (p.conversion_rate || 0).toFixed(2),
          (p.monthly_rent_value || 0).toFixed(2)
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(topPagesData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Top 10 Páginas');
    }

    // Aba 3: Páginas com Baixa Performance
    if (pageMetrics && pageMetrics.length > 0) {
      const leastPages = pageMetrics.slice().sort((a, b) => 
        (a.total_conversions || 0) - (b.total_conversions || 0)
      ).slice(0, 10);
      
      const leastPagesData = [
        ['Página', 'Conversões', 'Page Views', 'Taxa de Conversão (%)'],
        ...leastPages.map(p => [
          p.page_path || p.page_url,
          p.total_conversions || 0,
          p.total_page_views || 0,
          (p.conversion_rate || 0).toFixed(2)
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(leastPagesData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Baixa Performance');
    }

    // Aba 4: ROI por Página
    if (includeROI && financialMetrics && financialMetrics.length > 0) {
      const roiData = [
        ['Página', 'Receita (R$)', 'Custos (R$)', 'Lucro (R$)', 'ROI (%)', 'Margem (%)'],
        ...financialMetrics.map(r => [
          r.page_path || r.page_url || '',
          Number(r.monthly_revenue || 0).toFixed(2),
          Number(r.monthly_fixed_costs || 0).toFixed(2),
          Number(r.monthly_profit || 0).toFixed(2),
          Number(r.roi_percentage || 0).toFixed(2),
          Number(r.profit_margin || 0).toFixed(2)
        ])
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(roiData);
      XLSX.utils.book_append_sheet(wb, ws4, 'ROI Detalhado');
    }

    // Aba 5: E-commerce
    if (includeEcommerce && ecommerceEvents.length > 0) {
      // Process product data
      const productMap = new Map();
      ecommerceEvents.forEach(event => {
        const productId = event.metadata?.product_id || 'unknown';
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name: event.metadata?.product_name || productId,
            views: 0,
            addToCarts: 0,
            purchases: 0,
            revenue: 0
          });
        }
        const product = productMap.get(productId);
        if (event.event_type === 'product_view') product.views++;
        if (event.event_type === 'add_to_cart') product.addToCarts++;
        if (event.event_type === 'purchase') {
          product.purchases++;
          product.revenue += parseFloat(event.metadata?.revenue || '0');
        }
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Funnel metrics
      const productViews = ecommerceEvents.filter(e => e.event_type === 'product_view').length;
      const addToCarts = ecommerceEvents.filter(e => e.event_type === 'add_to_cart').length;
      const checkouts = ecommerceEvents.filter(e => e.event_type === 'begin_checkout').length;

      const ecommerceData = [
        ['MÉTRICAS DE E-COMMERCE'],
        [''],
        ['Receita Total', `R$ ${ecommerceTotalRevenue.toFixed(2)}`],
        ['Total de Pedidos', ecommerceTotalOrders],
        ['Ticket Médio (AOV)', `R$ ${ecommerceAOV.toFixed(2)}`],
        [''],
        ['FUNIL DE CONVERSÃO'],
        ['Visualizações de Produto', productViews],
        ['Adições ao Carrinho', addToCarts],
        ['Checkouts Iniciados', checkouts],
        ['Compras Finalizadas', ecommerceTotalOrders],
        ['Taxa de Conversão', `${productViews > 0 ? ((ecommerceTotalOrders / productViews) * 100).toFixed(2) : 0}%`],
        [''],
        ['TOP 10 PRODUTOS'],
        ['Produto', 'Visualizações', 'Add to Cart', 'Compras', 'Receita (R$)'],
        ...topProducts.map(p => [
          p.product_name,
          p.views,
          p.addToCarts,
          p.purchases,
          p.revenue.toFixed(2)
        ])
      ];
      
      const ws5 = XLSX.utils.aoa_to_sheet(ecommerceData);
      XLSX.utils.book_append_sheet(wb, ws5, 'E-commerce');
    }

    // Converte para buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${(reportName || 'relatorio').replace(/\s/g, '_')}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error generating Excel report:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
