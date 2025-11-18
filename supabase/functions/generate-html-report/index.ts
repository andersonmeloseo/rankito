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
    const { htmlContent, styles, reportName, siteName, period } = await req.json();

    console.log('Generating HTML report:', { reportName, siteName, period });

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
