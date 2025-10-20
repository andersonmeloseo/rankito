/**
 * Hook para capturar HTML renderizado de relatórios
 * Inclui todos os estilos inline para garantir renderização standalone
 */
export const useReportHTML = () => {
  /**
   * Extrai todos os estilos CSS da página atual
   */
  const extractAllStyles = (): string => {
    const styles: string[] = [];
    
    // Extrair estilos de todas as stylesheets
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          rules.forEach(rule => {
            styles.push(rule.cssText);
          });
        } catch (e) {
          // CORS pode bloquear acesso a algumas stylesheets
          console.warn('Could not access stylesheet:', e);
        }
      });
    } catch (e) {
      console.error('Error extracting styles:', e);
    }
    
    return styles.join('\n');
  };

  /**
   * Captura o HTML completo de um elemento do relatório
   * @param elementId - ID do elemento a ser capturado
   * @returns HTML standalone completo com estilos inline
   */
  const captureReportHTML = async (elementId: string = 'report-preview'): Promise<string> => {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Elemento com ID "${elementId}" não encontrado`);
    }

    // Capturar HTML do elemento
    const htmlContent = element.outerHTML;
    
    // Extrair todos os estilos CSS
    const styles = extractAllStyles();

    // Construir HTML standalone completo
    const fullHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Analytics</title>
  <style>
    /* Reset básico */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background: #ffffff;
      padding: 2rem;
    }
    
    /* Estilos da aplicação */
    ${styles}
    
    /* Garantir visibilidade de gráficos */
    svg {
      max-width: 100%;
      height: auto;
    }
    
    /* Print styles */
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    ${htmlContent}
  </div>
  
  <script>
    // Script para melhorar compatibilidade ao abrir o arquivo
    console.log('Relatório carregado com sucesso');
    
    // Garantir que gráficos SVG sejam renderizados corretamente
    document.addEventListener('DOMContentLoaded', function() {
      const svgs = document.querySelectorAll('svg');
      svgs.forEach(svg => {
        if (!svg.getAttribute('width')) {
          svg.setAttribute('width', '100%');
        }
        if (!svg.getAttribute('height')) {
          svg.setAttribute('height', 'auto');
        }
      });
    });
  </script>
</body>
</html>`;

    return fullHTML;
  };

  return {
    captureReportHTML,
    extractAllStyles
  };
};
