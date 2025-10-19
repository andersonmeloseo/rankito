import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportData } from './generateExcel';

export const generatePDFReport = async (data: ReportData, previewElement: HTMLElement, colors: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(22);
  pdf.setTextColor(colors.primary);
  pdf.text(data.name, 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Período: ${data.period.start} até ${data.period.end}`, 20, yPosition);
  
  yPosition += 15;

  // Resumo Executivo
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('📊 Resumo Executivo', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  const summaryLines = [
    `✓ Total de Conversões: ${data.summary.totalConversions.toLocaleString('pt-BR')}`,
    `✓ Total de Page Views: ${data.summary.totalPageViews.toLocaleString('pt-BR')}`,
    `✓ Taxa de Conversão: ${data.summary.conversionRate.toFixed(2)}%`,
  ];
  if (data.summary.roi) {
    summaryLines.push(`✓ ROI: ${data.summary.roi > 0 ? '+' : ''}${data.summary.roi.toFixed(1)}%`);
  }
  
  summaryLines.forEach(line => {
    pdf.text(line, 25, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Capturar gráficos
  const chartElements = previewElement.querySelectorAll('.report-chart');
  
  for (let i = 0; i < chartElements.length; i++) {
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    const chartElement = chartElements[i] as HTMLElement;
    
    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: colors.background,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
    }
  }

  // Top Páginas
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('📄 Top 10 Páginas que Mais Convertem', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(9);
  data.topPages.slice(0, 10).forEach((page, index) => {
    if (yPosition > pageHeight - 10) {
      pdf.addPage();
      yPosition = 20;
    }
    
    const text = `${index + 1}. ${page.page} - ${page.conversions} conversões (${page.conversionRate.toFixed(1)}%)`;
    pdf.text(text, 25, yPosition, { maxWidth: pageWidth - 45 });
    yPosition += 6;
  });

  // Páginas com Baixa Performance
  if (data.bottomPages.length > 0) {
    yPosition += 10;
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(220, 38, 38);
    pdf.text('⚠️ Páginas com Baixa Performance', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    data.bottomPages.slice(0, 10).forEach((page, index) => {
      if (yPosition > pageHeight - 10) {
        pdf.addPage();
        yPosition = 20;
      }
      
      const text = `${index + 1}. ${page.page} - ${page.conversions} conversões (${page.conversionRate.toFixed(1)}%)`;
      pdf.text(text, 25, yPosition, { maxWidth: pageWidth - 45 });
      yPosition += 6;
    });
  }

  // Rodapé
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Baixar
  pdf.save(`${data.name.replace(/\s+/g, '_')}.pdf`);
};
