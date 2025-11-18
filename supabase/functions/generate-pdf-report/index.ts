import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteId, reportName, period, includeConversions, includePageViews, includeROI } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcula datas
    const endDate = new Date();
    const startDate = period === 'all' 
      ? new Date('2020-01-01')
      : new Date(endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Busca dados
    const { data: site } = await supabase
      .from('rank_rent_sites')
      .select('site_name, site_url')
      .eq('id', siteId)
      .single();

    const { data: conversions } = await supabase
      .from('rank_rent_conversions')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: pageMetrics } = await supabase
      .from('rank_rent_page_metrics')
      .select('*')
      .eq('site_id', siteId)
      .order('total_conversions', { ascending: false });

    const { data: financialMetrics } = await supabase
      .from('rank_rent_financial_metrics')
      .select('*')
      .eq('site_id', siteId);

    // Processa dados
    const pageViews = conversions?.filter(c => c.event_type === 'page_view') || [];
    const actualConversions = conversions?.filter(c => c.event_type !== 'page_view') || [];
    const totalConversions = actualConversions.length;
    const totalPageViews = pageViews.length;
    const conversionRate = totalPageViews > 0 ? (totalConversions / totalPageViews) * 100 : 0;

    let totalRevenue = 0;
    let totalProfit = 0;
    let avgROI = 0;
    
    if (financialMetrics && financialMetrics.length > 0) {
      totalRevenue = financialMetrics.reduce((sum, m) => sum + Number(m.monthly_revenue || 0), 0);
      totalProfit = financialMetrics.reduce((sum, m) => sum + Number(m.monthly_profit || 0), 0);
      avgROI = financialMetrics.reduce((sum, m) => sum + Number(m.roi_percentage || 0), 0) / financialMetrics.length;
    }

    // Gera HTML otimizado para impressão em PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${reportName || `Relatório ${site?.site_name}`}</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-after: always; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white;
      border-radius: 10px;
      margin-bottom: 40px;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; margin: 5px 0; }
    
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .metric-card {
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      color: white;
    }
    .metric-card.purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
    .metric-card.blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
    .metric-card.green { background: linear-gradient(135deg, #10b981, #34d399); }
    .metric-card.yellow { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    .metric-value { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .metric-label { font-size: 13px; opacity: 0.9; }
    
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 24px;
      color: #8b5cf6;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #8b5cf6;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    tr:nth-child(even) { background: #fafafa; }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${reportName || `Relatório ${site?.site_name}`}</h1>
    <p>${site?.site_name || ''}</p>
    <p>${site?.site_url || ''}</p>
    <p>Período: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}</p>
  </div>

  <div class="metrics">
    ${includeConversions ? `
    <div class="metric-card purple">
      <div class="metric-label">Total de Conversões</div>
      <div class="metric-value">${totalConversions}</div>
    </div>
    ` : ''}
    
    ${includePageViews ? `
    <div class="metric-card blue">
      <div class="metric-label">Total de Page Views</div>
      <div class="metric-value">${totalPageViews}</div>
    </div>
    ` : ''}
    
    <div class="metric-card green">
      <div class="metric-label">Taxa de Conversão</div>
      <div class="metric-value">${conversionRate.toFixed(2)}%</div>
    </div>
    
    ${includeROI ? `
    <div class="metric-card yellow">
      <div class="metric-label">ROI Médio</div>
      <div class="metric-value">${avgROI.toFixed(2)}%</div>
    </div>
    ` : ''}
  </div>

  ${includeConversions && pageMetrics && pageMetrics.length > 0 ? `
  <div class="section">
    <h2 class="section-title">🏆 Top 10 Páginas que Mais Convertem</h2>
    <table>
      <thead>
        <tr>
          <th>Página</th>
          <th style="text-align: right;">Conversões</th>
          <th style="text-align: right;">Page Views</th>
          <th style="text-align: right;">Taxa</th>
        </tr>
      </thead>
      <tbody>
        ${pageMetrics.slice(0, 10).map((p, i) => `
          <tr>
            <td>${p.page_path || p.page_url}</td>
            <td style="text-align: right; font-weight: 600;">${p.total_conversions || 0}</td>
            <td style="text-align: right;">${p.total_page_views || 0}</td>
            <td style="text-align: right;">${(p.conversion_rate || 0).toFixed(2)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="page-break"></div>

  ${includeROI && financialMetrics && financialMetrics.length > 0 ? `
  <div class="section">
    <h2 class="section-title">💰 Análise de ROI por Página</h2>
    <table>
      <thead>
        <tr>
          <th>Página</th>
          <th style="text-align: right;">Receita (R$)</th>
          <th style="text-align: right;">Lucro (R$)</th>
          <th style="text-align: right;">ROI (%)</th>
        </tr>
      </thead>
      <tbody>
        ${financialMetrics.slice(0, 15).map((m, i) => `
          <tr>
            <td>${m.page_path || m.page_url || 'N/A'}</td>
            <td style="text-align: right;">R$ ${Number(m.monthly_revenue || 0).toFixed(2)}</td>
            <td style="text-align: right;">R$ ${Number(m.monthly_profit || 0).toFixed(2)}</td>
            <td style="text-align: right; font-weight: 600; color: ${Number(m.roi_percentage || 0) > 0 ? '#10b981' : '#ef4444'};">
              ${Number(m.roi_percentage || 0).toFixed(2)}%
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p style="margin-top: 10px;">Para imprimir em PDF: Ctrl+P (Cmd+P no Mac) → Salvar como PDF</p>
  </div>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${(reportName || 'relatorio').replace(/\s/g, '_')}.html"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
