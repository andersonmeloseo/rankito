export type ReportLocale = 'pt-BR' | 'en-US' | 'es-ES';
export type Currency = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'MXN';

export interface ReportTranslations {
  [key: string]: string;
}

export const reportTranslations: Record<ReportLocale, ReportTranslations> = {
  'pt-BR': {
    // Títulos principais
    reportTitle: 'Relatório de Performance',
    performanceReport: 'Relatório de Performance',
    financialConfig: 'Configuração Financeira',
    
    // Métricas
    totalConversions: 'Total de Conversões',
    totalPageViews: 'Total de Visualizações',
    conversionRate: 'Taxa de Conversão',
    totalValueGenerated: 'Valor Total Gerado',
    avgConversionValue: 'Valor Médio por Conversão',
    costPerConversion: 'Custo por Conversão',
    
    // Seções
    topPages: 'Top 10 Páginas que Mais Convertem',
    conversionTypes: 'Distribuição de Tipos de Conversão',
    topReferrers: 'Top Origens de Tráfego',
    comparisonInsight: 'Insights da Comparação',
    financialAnalysis: 'Análise Financeira',
    
    // Comparação
    period: 'Período',
    vs: 'vs',
    previousPeriod: 'período anterior',
    comparison: 'Comparação',
    currentPeriod: 'Período Atual',
    
    // Tabelas
    page: 'Página',
    conversions: 'Conversões',
    pageViews: 'Visualizações',
    rate: 'Taxa',
    origin: 'Origem',
    type: 'Tipo',
    count: 'Quantidade',
    
    // Configuração Financeira
    enterCostPerConversion: 'Informe o custo por conversão',
    selectCurrency: 'Selecione a moeda',
    selectLanguage: 'Selecione o idioma',
    portuguese: 'Português',
    english: 'Inglês',
    spanish: 'Espanhol',
    
    // Mensagens
    savingsMessage: 'Com {{conversions}} conversões a {{costPer}} cada, você gerou {{value}} de valor!',
    excellentGrowth: 'Excelente! Conversões cresceram {{change}}%',
    attentionDrop: 'Atenção: Queda de {{change}}% nas conversões',
    trafficGrowth: 'Tráfego cresceu {{change}}%! Marketing funcionando',
    conversionRateImproved: 'Taxa de conversão melhorou {{change}}%',
    conversionRateDropped: 'Taxa de conversão caiu {{change}}%',
    
    // Ações
    generatePreview: 'Gerar Preview',
    saveReport: 'Salvar Relatório',
    exportExcel: 'Exportar XLSX',
    exportPDF: 'Exportar PDF',
    exportHTML: 'Exportar HTML',
    scheduleReport: 'Agendar Envio',
    shareReport: 'Compartilhar',
    savedReports: 'Relatórios Salvos',
    
    // Status
    loading: 'Carregando...',
    generating: 'Gerando relatório...',
    success: 'Sucesso!',
    error: 'Erro ao processar',
    
    // Agendamento
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    frequency: 'Frequência',
    emailTo: 'Enviar para',
    
    // Compartilhamento
    shareLink: 'Link de Compartilhamento',
    linkExpires: 'Link expira em',
    copyLink: 'Copiar Link',
    linkCopied: 'Link copiado!',
    
    // Datas
    days: 'dias',
    generatedOn: 'Gerado em',
    lastDays: 'Últimos {{days}} dias',
    allTime: 'Todo período',
  },
  'en-US': {
    // Main titles
    reportTitle: 'Performance Report',
    performanceReport: 'Performance Report',
    financialConfig: 'Financial Configuration',
    
    // Metrics
    totalConversions: 'Total Conversions',
    totalPageViews: 'Total Page Views',
    conversionRate: 'Conversion Rate',
    totalValueGenerated: 'Total Value Generated',
    avgConversionValue: 'Average Conversion Value',
    costPerConversion: 'Cost per Conversion',
    
    // Sections
    topPages: 'Top 10 Converting Pages',
    conversionTypes: 'Conversion Type Distribution',
    topReferrers: 'Top Traffic Sources',
    comparisonInsight: 'Comparison Insights',
    financialAnalysis: 'Financial Analysis',
    
    // Comparison
    period: 'Period',
    vs: 'vs',
    previousPeriod: 'previous period',
    comparison: 'Comparison',
    currentPeriod: 'Current Period',
    
    // Tables
    page: 'Page',
    conversions: 'Conversions',
    pageViews: 'Page Views',
    rate: 'Rate',
    origin: 'Source',
    type: 'Type',
    count: 'Count',
    
    // Financial Configuration
    enterCostPerConversion: 'Enter cost per conversion',
    selectCurrency: 'Select currency',
    selectLanguage: 'Select language',
    portuguese: 'Portuguese',
    english: 'English',
    spanish: 'Spanish',
    
    // Messages
    savingsMessage: 'With {{conversions}} conversions at {{costPer}} each, you generated {{value}} in value!',
    excellentGrowth: 'Excellent! Conversions grew {{change}}%',
    attentionDrop: 'Attention: {{change}}% drop in conversions',
    trafficGrowth: 'Traffic grew {{change}}%! Marketing working',
    conversionRateImproved: 'Conversion rate improved {{change}}%',
    conversionRateDropped: 'Conversion rate dropped {{change}}%',
    
    // Actions
    generatePreview: 'Generate Preview',
    saveReport: 'Save Report',
    exportExcel: 'Export XLSX',
    exportPDF: 'Export PDF',
    exportHTML: 'Export HTML',
    scheduleReport: 'Schedule Delivery',
    shareReport: 'Share',
    savedReports: 'Saved Reports',
    
    // Status
    loading: 'Loading...',
    generating: 'Generating report...',
    success: 'Success!',
    error: 'Error processing',
    
    // Scheduling
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    frequency: 'Frequency',
    emailTo: 'Send to',
    
    // Sharing
    shareLink: 'Share Link',
    linkExpires: 'Link expires in',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied!',
    
    // Dates
    days: 'days',
    generatedOn: 'Generated on',
    lastDays: 'Last {{days}} days',
    allTime: 'All time',
  },
  'es-ES': {
    // Títulos principales
    reportTitle: 'Informe de Rendimiento',
    performanceReport: 'Informe de Rendimiento',
    financialConfig: 'Configuración Financiera',
    
    // Métricas
    totalConversions: 'Total de Conversiones',
    totalPageViews: 'Total de Visualizaciones',
    conversionRate: 'Tasa de Conversión',
    totalValueGenerated: 'Valor Total Generado',
    avgConversionValue: 'Valor Promedio por Conversión',
    costPerConversion: 'Costo por Conversión',
    
    // Secciones
    topPages: 'Top 10 Páginas que Más Convierten',
    conversionTypes: 'Distribución de Tipos de Conversión',
    topReferrers: 'Top Fuentes de Tráfico',
    comparisonInsight: 'Insights de Comparación',
    financialAnalysis: 'Análisis Financiero',
    
    // Comparación
    period: 'Período',
    vs: 'vs',
    previousPeriod: 'período anterior',
    comparison: 'Comparación',
    currentPeriod: 'Período Actual',
    
    // Tablas
    page: 'Página',
    conversions: 'Conversiones',
    pageViews: 'Visualizaciones',
    rate: 'Tasa',
    origin: 'Origen',
    type: 'Tipo',
    count: 'Cantidad',
    
    // Configuración Financiera
    enterCostPerConversion: 'Ingrese el costo por conversión',
    selectCurrency: 'Seleccione la moneda',
    selectLanguage: 'Seleccione el idioma',
    portuguese: 'Portugués',
    english: 'Inglés',
    spanish: 'Español',
    
    // Mensajes
    savingsMessage: '¡Con {{conversions}} conversiones a {{costPer}} cada una, generaste {{value}} de valor!',
    excellentGrowth: '¡Excelente! Las conversiones crecieron {{change}}%',
    attentionDrop: 'Atención: Caída del {{change}}% en conversiones',
    trafficGrowth: '¡El tráfico creció {{change}}%! Marketing funcionando',
    conversionRateImproved: 'Tasa de conversión mejoró {{change}}%',
    conversionRateDropped: 'Tasa de conversión cayó {{change}}%',
    
    // Acciones
    generatePreview: 'Generar Vista Previa',
    saveReport: 'Guardar Informe',
    exportExcel: 'Exportar XLSX',
    exportPDF: 'Exportar PDF',
    exportHTML: 'Exportar HTML',
    scheduleReport: 'Programar Envío',
    shareReport: 'Compartir',
    savedReports: 'Informes Guardados',
    
    // Estado
    loading: 'Cargando...',
    generating: 'Generando informe...',
    success: '¡Éxito!',
    error: 'Error al procesar',
    
    // Programación
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    frequency: 'Frecuencia',
    emailTo: 'Enviar a',
    
    // Compartir
    shareLink: 'Enlace para Compartir',
    linkExpires: 'El enlace expira en',
    copyLink: 'Copiar Enlace',
    linkCopied: '¡Enlace copiado!',
    
    // Fechas
    days: 'días',
    generatedOn: 'Generado el',
    lastDays: 'Últimos {{days}} días',
    allTime: 'Todo el período',
  }
};

export const currencySymbols: Record<Currency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£',
  MXN: '$'
};

export const currencyLocales: Record<Currency, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  MXN: 'es-MX'
};

export const useReportTranslation = (locale: ReportLocale) => {
  const t = (key: string, params?: Record<string, any>) => {
    let text = reportTranslations[locale][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }
    
    return text;
  };
  
  return { t };
};

export const formatCurrency = (value: number, currency: Currency, locale?: string) => {
  const targetLocale = locale || currencyLocales[currency];
  
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
