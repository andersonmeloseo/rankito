import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { htmlContent, styles, reportName, siteName, period, includeEcommerce, ecommerceData } = await req.json();

    console.log('Generating HTML report:', { reportName, siteName, period, includeEcommerce });

    // Construir documento HTML completo com o conteúdo capturado
    const fullHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName}</title>
  <style>
    ${styles}
    
    /* Ajustes para exibição standalone */
    body {
      margin: 0;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
    }

    /* Container principal */
    .report-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header do relatório */
    .report-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .report-header h1 {
      color: #7c3aed;
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .report-header .site-name {
      color: #6b7280;
      margin: 0.25rem 0;
      font-size: 1rem;
      font-weight: 500;
    }

    .report-header .period {
      color: #9ca3af;
      margin: 0.25rem 0;
      font-size: 0.875rem;
    }

    /* Footer do relatório */
    .report-footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid rgba(255, 255, 255, 0.3);
    }

    .report-footer p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Ajustes para impressão */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .report-header {
        box-shadow: none;
        border: 1px solid #e5e7eb;
      }

      .report-footer {
        border-top-color: #e5e7eb;
      }

      .report-footer p {
        color: #6b7280;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="report-header">
      <h1>${reportName}</h1>
      ${siteName ? `<p class="site-name">${siteName}</p>` : ''}
      <p class="period">${period}</p>
    </div>
    
    ${htmlContent}
    
    ${includeEcommerce && ecommerceData ? `
    <div style="margin-top: 3rem; padding: 2rem; background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #7c3aed; font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
        🛒 E-commerce Analytics
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div style="padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 0.5rem; color: white;">
          <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Receita Total</div>
          <div style="font-size: 1.5rem; font-weight: 700;">R$ ${ecommerceData.totalRevenue?.toFixed(2) || '0.00'}</div>
        </div>
        <div style="padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 0.5rem; color: white;">
          <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Total de Pedidos</div>
          <div style="font-size: 1.5rem; font-weight: 700;">${ecommerceData.totalOrders || 0}</div>
        </div>
        <div style="padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 0.5rem; color: white;">
          <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Ticket Médio</div>
          <div style="font-size: 1.5rem; font-weight: 700;">R$ ${ecommerceData.averageOrderValue?.toFixed(2) || '0.00'}</div>
        </div>
      </div>
      
      ${ecommerceData.topProducts && ecommerceData.topProducts.length > 0 ? `
      <div style="margin-top: 2rem;">
        <h3 style="color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">📦 Top 10 Produtos</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;">
          <thead style="background: #f9fafb;">
            <tr>
              <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Produto</th>
              <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Visualizações</th>
              <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Add to Cart</th>
              <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Compras</th>
              <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Receita</th>
            </tr>
          </thead>
          <tbody>
            ${ecommerceData.topProducts.slice(0, 10).map((product: any, i: number) => `
              <tr style="border-bottom: 1px solid #e5e7eb; ${i % 2 === 0 ? 'background: #f9fafb;' : ''}">
                <td style="padding: 0.75rem; color: #374151; font-weight: 500;">${product.name || 'Unknown'}</td>
                <td style="padding: 0.75rem; text-align: right; color: #6b7280;">${product.views || 0}</td>
                <td style="padding: 0.75rem; text-align: right; color: #6b7280;">${product.addToCarts || 0}</td>
                <td style="padding: 0.75rem; text-align: right; color: #6b7280;">${product.purchases || 0}</td>
                <td style="padding: 0.75rem; text-align: right; color: #374151; font-weight: 600;">R$ ${(product.revenue || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${ecommerceData.funnel ? `
      <div style="margin-top: 2rem;">
        <h3 style="color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">🎯 Funil de Conversão</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Visualizações</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #374151;">${ecommerceData.funnel.productViews || 0}</div>
            <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">100%</div>
          </div>
          <div style="padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Add to Cart</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #374151;">${ecommerceData.funnel.addToCarts || 0}</div>
            <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">
              ${ecommerceData.funnel.productViews > 0 ? ((ecommerceData.funnel.addToCarts / ecommerceData.funnel.productViews) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div style="padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Checkouts</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #374151;">${ecommerceData.funnel.checkouts || 0}</div>
            <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">
              ${ecommerceData.funnel.productViews > 0 ? ((ecommerceData.funnel.checkouts / ecommerceData.funnel.productViews) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div style="padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Compras</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #374151;">${ecommerceData.funnel.purchases || 0}</div>
            <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">
              ${ecommerceData.funnel.productViews > 0 ? ((ecommerceData.funnel.purchases / ecommerceData.funnel.productViews) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <div class="report-footer">
      <p>Relatório gerado em ${new Date().toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short'
      })}</p>
    </div>
  </div>
</body>
</html>
    `;

    console.log('HTML report generated successfully');

    return new Response(fullHTML, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportName.replace(/\s/g, '_')}.html"`
      }
    });

  } catch (error) {
    console.error('Error generating HTML report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate HTML report';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
