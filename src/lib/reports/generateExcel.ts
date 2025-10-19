import * as XLSX from 'xlsx';

export interface ReportData {
  name: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalConversions: number;
    totalPageViews: number;
    conversionRate: number;
    roi?: number;
  };
  dailyData: Array<{
    date: string;
    conversions: number;
    pageViews: number;
    conversionRate: number;
  }>;
  topPages: Array<{
    page: string;
    conversions: number;
    pageViews: number;
    conversionRate: number;
  }>;
  bottomPages: Array<{
    page: string;
    conversions: number;
    pageViews: number;
    conversionRate: number;
  }>;
  conversionsByType?: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export const generateExcelReport = (data: ReportData) => {
  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo
  const summaryData = [
    ['Relatório', data.name],
    ['Período', `${data.period.start} até ${data.period.end}`],
    [''],
    ['Resumo Executivo'],
    ['Total de Conversões', data.summary.totalConversions],
    ['Total de Page Views', data.summary.totalPageViews],
    ['Taxa de Conversão', `${data.summary.conversionRate.toFixed(2)}%`],
    ...(data.summary.roi ? [['ROI', `${data.summary.roi.toFixed(2)}%`]] : []),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Aba 2: Dados Diários
  const dailySheet = XLSX.utils.json_to_sheet(
    data.dailyData.map(d => ({
      'Data': d.date,
      'Conversões': d.conversions,
      'Page Views': d.pageViews,
      'Taxa de Conversão (%)': d.conversionRate.toFixed(2),
    }))
  );
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Dados Diários');

  // Aba 3: Top Páginas
  const topPagesSheet = XLSX.utils.json_to_sheet(
    data.topPages.map((p, i) => ({
      'Posição': i + 1,
      'Página': p.page,
      'Conversões': p.conversions,
      'Page Views': p.pageViews,
      'Taxa de Conversão (%)': p.conversionRate.toFixed(2),
    }))
  );
  XLSX.utils.book_append_sheet(workbook, topPagesSheet, 'Top Páginas');

  // Aba 4: Páginas com Baixa Performance
  const bottomPagesSheet = XLSX.utils.json_to_sheet(
    data.bottomPages.map((p, i) => ({
      'Posição': i + 1,
      'Página': p.page,
      'Conversões': p.conversions,
      'Page Views': p.pageViews,
      'Taxa de Conversão (%)': p.conversionRate.toFixed(2),
    }))
  );
  XLSX.utils.book_append_sheet(workbook, bottomPagesSheet, 'Baixa Performance');

  // Aba 5: Conversões por Tipo (se disponível)
  if (data.conversionsByType && data.conversionsByType.length > 0) {
    const typeSheet = XLSX.utils.json_to_sheet(
      data.conversionsByType.map(t => ({
        'Tipo': t.type,
        'Quantidade': t.count,
        'Porcentagem': `${t.percentage.toFixed(1)}%`,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, typeSheet, 'Por Tipo');
  }

  // Gerar e baixar
  XLSX.writeFile(workbook, `${data.name.replace(/\s+/g, '_')}.xlsx`);
};
