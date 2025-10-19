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
      .select('created_at, event_type')
      .eq('site_id', siteId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

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

    // Agrupa conversões por dia
    const conversionsByDay = new Map<string, number>();
    actualConversions.forEach(conv => {
      const date = new Date(conv.created_at).toLocaleDateString('pt-BR');
      conversionsByDay.set(date, (conversionsByDay.get(date) || 0) + 1);
    });

    const timelineData = Array.from(conversionsByDay.entries()).map(([date, count]) => ({ date, count }));

    // Calcula métricas financeiras
    let totalRevenue = 0;
    let totalProfit = 0;
    let avgROI = 0;
    
    if (financialMetrics && financialMetrics.length > 0) {
      totalRevenue = financialMetrics.reduce((sum, m) => sum + Number(m.monthly_revenue || 0), 0);
      totalProfit = financialMetrics.reduce((sum, m) => sum + Number(m.monthly_profit || 0), 0);
      avgROI = financialMetrics.reduce((sum, m) => sum + Number(m.roi_percentage || 0), 0) / financialMetrics.length;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName || `Relatório ${site?.site_name}`}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: #8b5cf6;
      --secondary: #3b82f6;
      --accent: #10b981;
    }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      padding: 2rem;
    }
    .metric-card {
      padding: 1.5rem;
      border-radius: 0.75rem;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0.5rem 0;
    }
    .metric-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
    }
    th:hover {
      background: #f3f4f6;
    }
    tr:hover {
      background: #f9fafb;
    }
    .section {
      padding: 2rem;
      border-top: 1px solid #e5e7eb;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      color: var(--primary);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 style="font-size: 2.5rem; margin: 0;">${reportName || `Relatório ${site?.site_name}`}</h1>
      <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${site?.site_name || ''}</p>
      <p style="margin: 0.25rem 0 0 0; opacity: 0.9;">${site?.site_url || ''}</p>
      <p style="margin: 0.5rem 0 0 0; opacity: 0.8; font-size: 0.875rem;">
        Período: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}
      </p>
    </div>

    <!-- Métricas Principais -->
    <div class="metrics-grid">
      ${includeConversions ? `
      <div class="metric-card" style="background: linear-gradient(135deg, #8b5cf6, #a78bfa);">
        <div class="metric-label">Total de Conversões</div>
        <div class="metric-value">${totalConversions}</div>
      </div>
      ` : ''}
      
      ${includePageViews ? `
      <div class="metric-card" style="background: linear-gradient(135deg, #3b82f6, #60a5fa);">
        <div class="metric-label">Total de Page Views</div>
        <div class="metric-value">${totalPageViews}</div>
      </div>
      ` : ''}
      
      <div class="metric-card" style="background: linear-gradient(135deg, #10b981, #34d399);">
        <div class="metric-label">Taxa de Conversão</div>
        <div class="metric-value">${conversionRate.toFixed(2)}%</div>
      </div>
      
      ${includeROI ? `
      <div class="metric-card" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">
        <div class="metric-label">ROI Médio</div>
        <div class="metric-value">${avgROI.toFixed(2)}%</div>
      </div>
      ` : ''}
    </div>

    ${includeConversions && timelineData.length > 0 ? `
    <!-- Gráfico de Conversões -->
    <div class="section">
      <h2 class="section-title">📈 Conversões ao Longo do Tempo</h2>
      <canvas id="conversionChart" height="80"></canvas>
    </div>
    ` : ''}

    ${includeConversions && pageMetrics && pageMetrics.length > 0 ? `
    <!-- Top Páginas -->
    <div class="section">
      <h2 class="section-title">🏆 Top 10 Páginas que Mais Convertem</h2>
      <table id="topPagesTable">
        <thead>
          <tr>
            <th onclick="sortTable('topPagesTable', 0)">Página ↕️</th>
            <th onclick="sortTable('topPagesTable', 1)" style="text-align: right;">Conversões ↕️</th>
            <th onclick="sortTable('topPagesTable', 2)" style="text-align: right;">Page Views ↕️</th>
            <th onclick="sortTable('topPagesTable', 3)" style="text-align: right;">Taxa ↕️</th>
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

    ${includeROI && financialMetrics && financialMetrics.length > 0 ? `
    <!-- ROI Detalhado -->
    <div class="section">
      <h2 class="section-title">💰 Análise de ROI por Página</h2>
      <table id="roiTable">
        <thead>
          <tr>
            <th onclick="sortTable('roiTable', 0)">Página ↕️</th>
            <th onclick="sortTable('roiTable', 1)" style="text-align: right;">Receita (R$) ↕️</th>
            <th onclick="sortTable('roiTable', 2)" style="text-align: right;">Lucro (R$) ↕️</th>
            <th onclick="sortTable('roiTable', 3)" style="text-align: right;">ROI (%) ↕️</th>
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

    <!-- Rodapé -->
    <div class="section" style="text-align: center; color: #6b7280; font-size: 0.875rem;">
      <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  </div>

  <script>
    // Dados do relatório
    const timelineData = ${JSON.stringify(timelineData)};

    ${includeConversions && timelineData.length > 0 ? `
    // Renderiza gráfico
    const ctx = document.getElementById('conversionChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: timelineData.map(d => d.date),
        datasets: [{
          label: 'Conversões',
          data: timelineData.map(d => d.count),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
    ` : ''}

    // Função de ordenação de tabelas
    function sortTable(tableId, columnIndex) {
      const table = document.getElementById(tableId);
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      rows.sort((a, b) => {
        const aValue = a.children[columnIndex].textContent.replace(/[^0-9.-]/g, '');
        const bValue = b.children[columnIndex].textContent.replace(/[^0-9.-]/g, '');
        
        if (!isNaN(aValue) && !isNaN(bValue)) {
          return parseFloat(bValue) - parseFloat(aValue);
        }
        return bValue.localeCompare(aValue);
      });
      
      rows.forEach(row => tbody.appendChild(row));
    }

    // Print functionality
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    });
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
