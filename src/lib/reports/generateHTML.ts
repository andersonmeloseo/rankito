import { ReportData } from './generateExcel';

export const generateInteractiveHTML = (data: ReportData, colors: any, theme: string) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.name}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --bg: ${colors.background};
      --text: ${colors.text};
    }
    body {
      background: var(--bg);
      color: var(--text);
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      margin-bottom: 24px;
    }
    .btn {
      background: var(--primary);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--secondary);
    }
    .stat-card {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: var(--primary);
      color: white;
      padding: 12px;
      text-align: left;
      cursor: pointer;
      user-select: none;
    }
    th:hover {
      background: var(--secondary);
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f9fafb;
    }
    .dark-mode {
      background: #1f2937;
      color: #f9fafb;
    }
    .dark-mode .card {
      background: #374151;
    }
    .dark-mode td {
      border-color: #4b5563;
    }
    .dark-mode tr:hover {
      background: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container mx-auto p-8 max-w-7xl">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-4xl font-bold mb-2">${data.name}</h1>
        <p class="text-gray-600">Período: ${data.period.start} até ${data.period.end}</p>
      </div>
      <div class="flex gap-4">
        <button onclick="toggleDarkMode()" class="btn">🌙 Dark Mode</button>
        <button onclick="window.print()" class="btn btn-secondary">🖨️ Imprimir</button>
      </div>
    </div>

    <!-- Filtros de Período -->
    <div class="card">
      <h3 class="text-lg font-semibold mb-4">🔍 Filtrar Período</h3>
      <div class="flex gap-3 flex-wrap">
        <button onclick="filterPeriod('all')" class="btn">Tudo</button>
        <button onclick="filterPeriod(7)" class="btn btn-secondary">7 dias</button>
        <button onclick="filterPeriod(14)" class="btn btn-secondary">14 dias</button>
        <button onclick="filterPeriod(30)" class="btn btn-secondary">30 dias</button>
        <button onclick="filterPeriod(60)" class="btn btn-secondary">60 dias</button>
        <button onclick="filterPeriod(90)" class="btn btn-secondary">90 dias</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat-card">
        <div class="text-3xl font-bold">${data.summary.totalConversions.toLocaleString('pt-BR')}</div>
        <div class="text-sm mt-2 opacity-90">Total de Conversões</div>
      </div>
      <div class="stat-card">
        <div class="text-3xl font-bold">${data.summary.totalPageViews.toLocaleString('pt-BR')}</div>
        <div class="text-sm mt-2 opacity-90">Total de Page Views</div>
      </div>
      <div class="stat-card">
        <div class="text-3xl font-bold">${data.summary.conversionRate.toFixed(2)}%</div>
        <div class="text-sm mt-2 opacity-90">Taxa de Conversão</div>
      </div>
      ${data.summary.roi ? `
      <div class="stat-card">
        <div class="text-3xl font-bold">${data.summary.roi > 0 ? '+' : ''}${data.summary.roi.toFixed(1)}%</div>
        <div class="text-sm mt-2 opacity-90">ROI</div>
      </div>
      ` : ''}
    </div>

    <!-- Gráfico de Conversões -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">📈 Conversões ao Longo do Tempo</h3>
      <canvas id="conversionsChart" height="80"></canvas>
    </div>

    <!-- Gráfico de Page Views -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">👁️ Page Views ao Longo do Tempo</h3>
      <canvas id="pageViewsChart" height="80"></canvas>
    </div>

    ${data.conversionsByType ? `
    <!-- Distribuição por Tipo -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">🎯 Conversões por Tipo</h3>
      <canvas id="typeChart" height="80"></canvas>
    </div>
    ` : ''}

    <!-- Top Páginas -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">🏆 Top Páginas que Mais Convertem</h3>
      <input 
        type="text" 
        id="searchTop" 
        placeholder="Buscar página..." 
        class="w-full p-3 border rounded-lg mb-4"
        onkeyup="searchTable('topPagesTable', 'searchTop')"
      />
      <div class="overflow-x-auto">
        <table id="topPagesTable">
          <thead>
            <tr>
              <th onclick="sortTable('topPagesTable', 0)">#</th>
              <th onclick="sortTable('topPagesTable', 1)">Página ↕️</th>
              <th onclick="sortTable('topPagesTable', 2)">Conversões ↕️</th>
              <th onclick="sortTable('topPagesTable', 3)">Page Views ↕️</th>
              <th onclick="sortTable('topPagesTable', 4)">Taxa (%) ↕️</th>
            </tr>
          </thead>
          <tbody>
            ${data.topPages.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.page}</td>
                <td>${p.conversions.toLocaleString('pt-BR')}</td>
                <td>${p.pageViews.toLocaleString('pt-BR')}</td>
                <td>${p.conversionRate.toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${data.bottomPages.length > 0 ? `
    <!-- Páginas com Baixa Performance -->
    <div class="card">
      <h3 class="text-xl font-semibold mb-4">⚠️ Páginas com Baixa Performance</h3>
      <input 
        type="text" 
        id="searchBottom" 
        placeholder="Buscar página..." 
        class="w-full p-3 border rounded-lg mb-4"
        onkeyup="searchTable('bottomPagesTable', 'searchBottom')"
      />
      <div class="overflow-x-auto">
        <table id="bottomPagesTable">
          <thead>
            <tr>
              <th onclick="sortTable('bottomPagesTable', 0)">#</th>
              <th onclick="sortTable('bottomPagesTable', 1)">Página ↕️</th>
              <th onclick="sortTable('bottomPagesTable', 2)">Conversões ↕️</th>
              <th onclick="sortTable('bottomPagesTable', 3)">Page Views ↕️</th>
              <th onclick="sortTable('bottomPagesTable', 4)">Taxa (%) ↕️</th>
            </tr>
          </thead>
          <tbody>
            ${data.bottomPages.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.page}</td>
                <td>${p.conversions.toLocaleString('pt-BR')}</td>
                <td>${p.pageViews.toLocaleString('pt-BR')}</td>
                <td>${p.conversionRate.toFixed(2)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="text-center text-gray-500 text-sm mt-8">
      Relatório gerado em ${new Date().toLocaleString('pt-BR')}
    </div>
  </div>

  <script>
    // Dados originais
    const originalData = ${JSON.stringify(data.dailyData)};
    let currentData = [...originalData];

    // Cores do tema
    const colors = {
      primary: '${colors.primary}',
      secondary: '${colors.secondary}',
      accent: '${colors.accent}',
    };

    // Gráfico de Conversões
    const ctxConversions = document.getElementById('conversionsChart').getContext('2d');
    let conversionsChart = new Chart(ctxConversions, {
      type: 'line',
      data: {
        labels: currentData.map(d => d.date),
        datasets: [{
          label: 'Conversões',
          data: currentData.map(d => d.conversions),
          borderColor: colors.primary,
          backgroundColor: colors.primary + '20',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Gráfico de Page Views
    const ctxPageViews = document.getElementById('pageViewsChart').getContext('2d');
    let pageViewsChart = new Chart(ctxPageViews, {
      type: 'line',
      data: {
        labels: currentData.map(d => d.date),
        datasets: [{
          label: 'Page Views',
          data: currentData.map(d => d.pageViews),
          borderColor: colors.secondary,
          backgroundColor: colors.secondary + '20',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    ${data.conversionsByType ? `
    // Gráfico por Tipo
    const ctxType = document.getElementById('typeChart').getContext('2d');
    new Chart(ctxType, {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(data.conversionsByType.map(t => t.type))},
        datasets: [{
          data: ${JSON.stringify(data.conversionsByType.map(t => t.count))},
          backgroundColor: [colors.primary, colors.secondary, colors.accent],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
    ` : ''}

    // Filtrar por período
    function filterPeriod(days) {
      if (days === 'all') {
        currentData = [...originalData];
      } else {
        currentData = originalData.slice(-days);
      }
      
      // Atualizar gráficos
      conversionsChart.data.labels = currentData.map(d => d.date);
      conversionsChart.data.datasets[0].data = currentData.map(d => d.conversions);
      conversionsChart.update();
      
      pageViewsChart.data.labels = currentData.map(d => d.date);
      pageViewsChart.data.datasets[0].data = currentData.map(d => d.pageViews);
      pageViewsChart.update();
    }

    // Ordenar tabela
    function sortTable(tableId, column) {
      const table = document.getElementById(tableId);
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      const sortedRows = rows.sort((a, b) => {
        const aVal = a.cells[column].innerText;
        const bVal = b.cells[column].innerText;
        
        const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return bNum - aNum;
        }
        
        return aVal.localeCompare(bVal);
      });
      
      tbody.innerHTML = '';
      sortedRows.forEach(row => tbody.appendChild(row));
    }

    // Buscar na tabela
    function searchTable(tableId, inputId) {
      const input = document.getElementById(inputId);
      const filter = input.value.toUpperCase();
      const table = document.getElementById(tableId);
      const rows = table.querySelector('tbody').querySelectorAll('tr');
      
      rows.forEach(row => {
        const text = row.innerText.toUpperCase();
        row.style.display = text.includes(filter) ? '' : 'none';
      });
    }

    // Dark mode
    function toggleDarkMode() {
      document.body.classList.toggle('dark-mode');
    }
  </script>
</body>
</html>
  `.trim();

  // Criar e baixar arquivo
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.name.replace(/\s+/g, '_')}.html`;
  link.click();
  URL.revokeObjectURL(url);
};
