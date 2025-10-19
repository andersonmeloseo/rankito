import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteId, reportName, period, includeConversions, includePageViews, includeROI, financialConfig, enableComparison, style } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const periodDays = parseInt(period) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Comparison period (if enabled)
    let previousConversions: any[] = [];
    let comparisonTimelineData: any[] = [];
    if (enableComparison) {
      const previousEndDate = new Date(startDate.getTime() - 1);
      const previousStartDate = new Date(previousEndDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      const { data: prevConv } = await supabase
        .from('rank_rent_conversions')
        .select('*')
        .eq('site_id', siteId)
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())
        .order('created_at', { ascending: true });
      
      previousConversions = prevConv || [];
      
      // Group previous period by date
      const prevTimelineMap = new Map();
      previousConversions.forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString('pt-BR');
        prevTimelineMap.set(date, (prevTimelineMap.get(date) || 0) + 1);
      });
      
      comparisonTimelineData = Array.from(prevTimelineMap.entries()).map(([date, count]) => ({ date, count }));
    }

    // Fetch site info
    const { data: site } = await supabase
      .from('rank_rent_sites')
      .select('site_name, site_url')
      .eq('id', siteId)
      .single();

    // Fetch conversions
    const { data: conversions } = await supabase
      .from('rank_rent_conversions')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Fetch page metrics
    const { data: pageMetrics } = await supabase
      .from('rank_rent_page_metrics')
      .select('*')
      .eq('site_id', siteId)
      .gte('created_at', startDate.toISOString());

    // Process data
    const totalConversions = conversions?.length || 0;
    const totalPageViews = pageMetrics?.reduce((sum, m) => sum + (m.page_views || 0), 0) || 0;
    const conversionRate = totalPageViews > 0 ? (totalConversions / totalPageViews * 100) : 0;

    // Group by date for timeline
    const timelineMap = new Map();
    conversions?.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString('pt-BR');
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });

    const pageViewsMap = new Map();
    pageMetrics?.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString('pt-BR');
      pageViewsMap.set(date, (pageViewsMap.get(date) || 0) + (m.page_views || 0));
    });

    // Top pages
    const pageStatsMap = new Map();
    conversions?.forEach(c => {
      const key = c.page_url || 'Desconhecido';
      if (!pageStatsMap.has(key)) {
        pageStatsMap.set(key, { url: key, title: c.page_title || key, conversions: 0, views: 0 });
      }
      pageStatsMap.get(key).conversions++;
    });

    pageMetrics?.forEach(m => {
      const key = m.page_url || 'Desconhecido';
      if (!pageStatsMap.has(key)) {
        pageStatsMap.set(key, { url: key, title: m.page_title || key, conversions: 0, views: 0 });
      }
      pageStatsMap.get(key).views += m.page_views || 0;
    });

    const topPages = Array.from(pageStatsMap.values())
      .map(p => ({ ...p, rate: p.views > 0 ? (p.conversions / p.views * 100) : 0 }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 20);

    // Conversion types
    const typeMap = new Map();
    conversions?.forEach(c => {
      const type = c.event_type || 'Outros';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    const conversionTypes = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

    // Referrers
    const referrerMap = new Map();
    conversions?.forEach(c => {
      const ref = c.referrer || 'Direto';
      referrerMap.set(ref, (referrerMap.get(ref) || 0) + 1);
    });
    const referrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Heatmap (day of week x hour)
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    conversions?.forEach(c => {
      const date = new Date(c.created_at);
      const day = date.getDay();
      const hour = date.getHours();
      heatmapData[day][hour]++;
    });

    // Bubble data
    const bubbleData = topPages.slice(0, 15).map(p => ({
      name: p.title.length > 40 ? p.title.substring(0, 40) + '...' : p.title,
      x: p.views,
      y: p.conversions,
      r: Math.max(5, Math.min(30, p.rate * 2))
    }));

    // Radar data
    const avgConvRate = conversionRate;
    const trafficScore = Math.min(100, (totalPageViews / 1000) * 100);
    const engagementScore = Math.min(100, (totalConversions / 100) * 100);
    const diversityScore = Math.min(100, (topPages.length / 50) * 100);
    const consistencyScore = timelineMap.size > 0 ? Math.min(100, (timelineMap.size / periodDays) * 100) : 0;

    const radarData = [
      { metric: 'Tráfego', value: trafficScore },
      { metric: 'Conversão', value: Math.min(100, avgConvRate * 10) },
      { metric: 'Engajamento', value: engagementScore },
      { metric: 'Diversidade', value: diversityScore },
      { metric: 'Consistência', value: consistencyScore }
    ];

    // Funnel
    const funnelData = {
      pageViews: totalPageViews,
      interactions: Math.round(totalConversions * 1.5),
      conversions: totalConversions
    };

    // Insights
    const insights: string[] = [];
    if (conversionRate > 5) insights.push(`✨ Taxa de conversão excelente: ${conversionRate.toFixed(2)}%`);
    if (conversionRate < 1 && totalPageViews > 100) insights.push(`⚠️ Taxa de conversão abaixo do esperado: ${conversionRate.toFixed(2)}%`);
    if (totalConversions > 100) insights.push(`🎯 Mais de 100 conversões no período!`);
    if (topPages[0]?.conversions > totalConversions * 0.3) insights.push(`🏆 Página destaque: ${topPages[0].title} (${topPages[0].conversions} conversões)`);
    if (referrers[0]?.count > totalConversions * 0.5) insights.push(`🔗 Tráfego concentrado: ${referrers[0].referrer} (${referrers[0].count} conversões)`);
    if (insights.length === 0) insights.push(`📊 Relatório de ${periodDays} dias gerado com sucesso`);

    // Financial
    const costPerConversion = financialConfig?.costPerConversion || 0;
    const currency = financialConfig?.currency || 'BRL';
    const totalValue = totalConversions * costPerConversion;

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency
      }).format(value);
    };

    // Build HTML
    const timelineLabels = Array.from(timelineMap.keys());
    const timelineValues = Array.from(timelineMap.values());
    const pageViewsValues = timelineLabels.map(date => pageViewsMap.get(date) || 0);

    const maxHeatmap = Math.max(...heatmapData.flat());
    const getHeatmapColor = (value: number) => {
      if (value === 0) return '#f3f4f6';
      const intensity = value / maxHeatmap;
      if (intensity > 0.7) return '#7c3aed';
      if (intensity > 0.4) return '#a78bfa';
      return '#ddd6fe';
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      color: #1f2937;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 2rem;
    }
    .header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 3px solid #8b5cf6;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 2rem;
      color: #7c3aed;
      margin-bottom: 0.5rem;
    }
    .header p {
      color: #6b7280;
      font-size: 1rem;
    }
    .insights {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-left: 4px solid #f59e0b;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
    }
    .insights h3 {
      color: #92400e;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .insights ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .insights li {
      color: #78350f;
      font-weight: 500;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
    }
    .metric-card h3 {
      font-size: 0.875rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    .metric-card .value {
      font-size: 2rem;
      font-weight: bold;
    }
    .section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 0.75rem;
    }
    .section-title {
      font-size: 1.5rem;
      color: #7c3aed;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .funnel-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
      margin: 1.5rem 0;
    }
    .funnel-stage {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    .funnel-bar {
      padding: 1.25rem 2rem;
      border-radius: 0.5rem;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      font-size: 1rem;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .funnel-arrow {
      font-size: 2rem;
      color: #8b5cf6;
      font-weight: bold;
    }
    .funnel-legend {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: white;
      border-radius: 0.5rem;
      border: 2px solid #e5e7eb;
    }
    .funnel-legend p {
      margin-bottom: 0.75rem;
      color: #4b5563;
      line-height: 1.6;
    }
    .funnel-legend strong {
      color: #1f2937;
    }
    .heatmap-container {
      overflow-x: auto;
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
    }
    .heatmap-grid {
      display: grid;
      grid-template-columns: auto repeat(24, 30px);
      gap: 2px;
      font-size: 0.75rem;
    }
    .heatmap-cell {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-weight: 500;
      transition: transform 0.2s;
    }
    .heatmap-cell:hover {
      transform: scale(1.2);
      z-index: 10;
    }
    .heatmap-label {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.5rem;
      font-weight: 600;
      color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    thead {
      background: #8b5cf6;
      color: white;
    }
    th, td {
      padding: 1rem;
      text-align: left;
    }
    tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    tbody tr:hover {
      background: #f3f4f6;
    }
    .financial-insight {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      border: 2px solid #10b981;
      padding: 1.25rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: #065f46;
      font-size: 1.125rem;
      margin: 2rem 0;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .financial-insight .icon {
      font-size: 2rem;
    }
    canvas {
      max-height: 400px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reportName}</h1>
      <p>${site?.site_name || 'Site'} • ${site?.site_url || ''}</p>
      <p>Período: ${periodDays} dias • Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>

    ${insights.length > 0 ? `
    <div class="insights">
      <h3>💡 Insights Automáticos</h3>
      <ul>
        ${insights.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Conversões</h3>
        <div class="value">${totalConversions.toLocaleString('pt-BR')}</div>
      </div>
      <div class="metric-card">
        <h3>Page Views</h3>
        <div class="value">${totalPageViews.toLocaleString('pt-BR')}</div>
      </div>
      <div class="metric-card">
        <h3>Taxa de Conversão</h3>
        <div class="value">${conversionRate.toFixed(2)}%</div>
      </div>
      ${includeROI && costPerConversion > 0 ? `
      <div class="metric-card">
        <h3>Valor Gerado</h3>
        <div class="value">${formatCurrency(totalValue)}</div>
      </div>
      ` : ''}
    </div>

    ${includeROI && costPerConversion > 0 ? `
    <div class="financial-insight">
      <span class="icon">💰</span>
      <span>Com ${totalConversions} conversões a ${formatCurrency(costPerConversion)}, você gerou ${formatCurrency(totalValue)} em valor!</span>
    </div>
    ` : ''}

    <div class="section">
      <h2 class="section-title">🎯 Funil de Conversão</h2>
      <div class="funnel-container">
        <div class="funnel-stage">
          <div class="funnel-bar" style="width: 100%; background: linear-gradient(to right, #3b82f6, #60a5fa);">
            <span>📄 Page Views</span>
            <span>${funnelData.pageViews.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div class="funnel-arrow">↓</div>
        <div class="funnel-stage">
          <div class="funnel-bar" style="width: ${Math.min(100, (funnelData.interactions/funnelData.pageViews*100))}%; background: linear-gradient(to right, #8b5cf6, #a78bfa);">
            <span>👆 Interações</span>
            <span>${funnelData.interactions.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <div class="funnel-arrow">↓</div>
        <div class="funnel-stage">
          <div class="funnel-bar" style="width: ${Math.min(100, (funnelData.conversions/funnelData.pageViews*100))}%; background: linear-gradient(to right, #10b981, #34d399);">
            <span>✅ Conversões</span>
            <span>${funnelData.conversions.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
      <div class="funnel-legend">
        <p><strong>📄 Page Views:</strong> Total de visualizações de página registradas no período</p>
        <p><strong>👆 Interações:</strong> Usuários que demonstraram interesse (estimativa: conversões × 1.5)</p>
        <p><strong>✅ Conversões:</strong> Ações concluídas (cliques em WhatsApp, formulários, botões, etc.)</p>
      </div>
    </div>

    ${includeConversions && includePageViews ? `
    <div class="section">
      <h2 class="section-title">📊 Conversões vs Page Views</h2>
      <canvas id="comboChart"></canvas>
    </div>
    ` : ''}

    ${includeConversions ? `
    <div class="section">
      <h2 class="section-title">📈 Timeline de Conversões</h2>
      <canvas id="timelineChart"></canvas>
    </div>
    ` : ''}

    ${enableComparison && previousConversions.length > 0 ? `
    <div class="section">
      <h2 class="section-title">📊 Comparação: Período Atual vs Anterior</h2>
      <canvas id="comparisonChart"></canvas>
      <p style="margin-top: 1rem; color: #6b7280; font-size: 0.875rem;">
        <strong>Período Atual:</strong> ${totalConversions} conversões • 
        <strong>Período Anterior:</strong> ${previousConversions.length} conversões • 
        <strong>Variação:</strong> ${totalConversions > previousConversions.length ? '📈' : '📉'} ${((totalConversions - previousConversions.length) / Math.max(1, previousConversions.length) * 100).toFixed(1)}%
      </p>
    </div>
    ` : ''}

    <div class="section">
      <h2 class="section-title">🔥 Mapa de Calor - Conversões por Dia/Hora</h2>
      <div class="heatmap-container">
        <div class="heatmap-grid">
          <div></div>
          ${Array.from({length: 24}, (_, i) => `<div style="text-align: center; font-weight: 600;">${i}h</div>`).join('')}
          ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, dayIdx) => `
            <div class="heatmap-label">${day}</div>
            ${heatmapData[dayIdx].map((value) => `
              <div class="heatmap-cell" style="background-color: ${getHeatmapColor(value)}; color: ${value > maxHeatmap * 0.5 ? 'white' : '#4b5563'};">
                ${value > 0 ? value : ''}
              </div>
            `).join('')}
          `).join('')}
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">💭 Análise de Performance por Página</h2>
      <canvas id="bubbleChart"></canvas>
      <p style="margin-top: 1rem; color: #6b7280; font-size: 0.875rem;">
        <strong>Legenda:</strong> Tamanho das bolhas = Taxa de Conversão • Eixo X = Page Views • Eixo Y = Conversões
      </p>
    </div>

    <div class="section">
      <h2 class="section-title">📡 Análise Multi-Dimensional</h2>
      <canvas id="radarChart"></canvas>
    </div>

    <div class="section">
      <h2 class="section-title">🏆 Top Páginas</h2>
      <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.875rem;">
        Mostrando as top ${Math.min(50, topPages.length)} páginas de ${Array.from(pageStatsMap.values()).length} total
      </p>
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
          ${topPages.slice(0, 50).map(p => `
            <tr>
              <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis;">${p.title}</td>
              <td style="text-align: right; font-weight: 600; color: #8b5cf6;">${p.conversions}</td>
              <td style="text-align: right;">${p.views.toLocaleString('pt-BR')}</td>
              <td style="text-align: right; font-weight: 600; color: #10b981;">${p.rate.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${conversionTypes.length > 0 ? `
    <div class="section">
      <h2 class="section-title">🎯 Distribuição de Tipos de Conversão</h2>
      <canvas id="pieChart"></canvas>
    </div>
    ` : ''}

    ${referrers.length > 0 ? `
    <div class="section">
      <h2 class="section-title">🔗 Top Referrers</h2>
      <table>
        <thead>
          <tr>
            <th>Origem</th>
            <th style="text-align: right;">Conversões</th>
          </tr>
        </thead>
        <tbody>
          ${referrers.map(r => `
            <tr>
              <td>${r.referrer}</td>
              <td style="text-align: right; font-weight: 600; color: #8b5cf6;">${r.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>

  <script>
    // Combo Chart
    ${includeConversions && includePageViews ? `
    const comboCtx = document.getElementById('comboChart').getContext('2d');
    new Chart(comboCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timelineLabels)},
        datasets: [
          {
            label: 'Conversões',
            data: ${JSON.stringify(timelineValues)},
            borderColor: '${style?.customColors?.primary || '#8b5cf6'}',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Page Views',
            data: ${JSON.stringify(pageViewsValues)},
            borderColor: '${style?.customColors?.secondary || '#3b82f6'}',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { 
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Conversões', color: '#8b5cf6' },
            ticks: { color: '#8b5cf6' }
          },
          y1: { 
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Page Views', color: '#3b82f6' },
            ticks: { color: '#3b82f6' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
    ` : ''}

    // Timeline Chart
    ${includeConversions ? `
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    new Chart(timelineCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timelineLabels)},
        datasets: [{
          label: 'Conversões',
          data: ${JSON.stringify(timelineValues)},
          borderColor: '${style?.customColors?.primary || '#8b5cf6'}',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true } }
      }
    });
    ` : ''}

    // Comparison Chart
    ${enableComparison && previousConversions.length > 0 ? `
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    const comparisonLabels = ${JSON.stringify(timelineLabels)};
    const comparisonPrevLabels = ${JSON.stringify(comparisonTimelineData.map((d: any) => d.date))};
    const comparisonPrevValues = ${JSON.stringify(comparisonTimelineData.map((d: any) => d.count))};
    
    new Chart(comparisonCtx, {
      type: 'line',
      data: {
        labels: comparisonLabels,
        datasets: [
          {
            label: 'Período Atual',
            data: ${JSON.stringify(timelineValues)},
            borderColor: '${style?.customColors?.primary || '#8b5cf6'}',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            tension: 0.4,
            fill: true,
            borderWidth: 3
          },
          {
            label: 'Período Anterior',
            data: comparisonPrevValues,
            borderColor: '#6b7280',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            tension: 0.4,
            fill: false,
            borderWidth: 2,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { 
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => \`\${ctx.dataset.label}: \${ctx.parsed.y} conversões\`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Conversões' }
          }
        }
      }
    });
    ` : ''}

    // Bubble Chart
    const bubbleCtx = document.getElementById('bubbleChart').getContext('2d');
    new Chart(bubbleCtx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Páginas',
          data: ${JSON.stringify(bubbleData)},
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: '${style?.customColors?.primary || '#8b5cf6'}',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          x: { 
            title: { display: true, text: 'Page Views' },
            ticks: { callback: (v) => v.toLocaleString('pt-BR') }
          },
          y: { 
            title: { display: true, text: 'Conversões' },
            ticks: { callback: (v) => v.toLocaleString('pt-BR') }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const point = ctx.raw;
                const bubble = ${JSON.stringify(bubbleData)}[ctx.dataIndex];
                return [
                  \`Página: \${bubble.name}\`,
                  \`Page Views: \${point.x.toLocaleString('pt-BR')}\`,
                  \`Conversões: \${point.y}\`,
                  \`Taxa: \${(point.y/point.x*100).toFixed(2)}%\`
                ];
              }
            }
          }
        }
      }
    });

    // Radar Chart
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: ${JSON.stringify(radarData.map(r => r.metric))},
        datasets: [{
          label: 'Performance',
          data: ${JSON.stringify(radarData.map(r => r.value))},
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: '${style?.customColors?.primary || '#8b5cf6'}',
          borderWidth: 3,
          pointBackgroundColor: '${style?.customColors?.primary || '#8b5cf6'}',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '${style?.customColors?.primary || '#8b5cf6'}',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });

    // Pie Chart
    ${conversionTypes.length > 0 ? `
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(conversionTypes.map(c => c.type))},
        datasets: [{
          data: ${JSON.stringify(conversionTypes.map(c => c.count))},
          backgroundColor: ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
    ` : ''}
  </script>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${(reportName || 'relatorio').replace(/\s/g, '_')}.html"`
      }
    });

  } catch (error) {
    console.error('Error generating HTML report:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
