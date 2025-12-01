export const pageMetricTooltips = {
  entries: {
    title: "Entradas",
    description: "Número de vezes que visitantes entraram no site por esta página",
    calculation: "Conta quantas sessões começaram nesta URL específica",
    interpretation: "Páginas com muitas entradas são pontos de entrada importantes - SEO, links externos ou campanhas direcionam para elas"
  },
  bounceRate: {
    title: "Taxa de Rejeição",
    description: "Percentual de visitantes que entraram por esta página e saíram sem navegar",
    calculation: "(Sessões de 1 página vindas desta URL ÷ Total de entradas nesta URL) × 100",
    interpretation: "Alta rejeição em páginas de entrada indica que o conteúdo não atendeu a expectativa do visitante"
  },
  avgTime: {
    title: "Tempo Médio na Página",
    description: "Duração média que os visitantes passam nesta página específica",
    calculation: "Soma de tempo em todas as visualizações ÷ número de visualizações",
    interpretation: "Tempo alto indica conteúdo engajante. Muito baixo (<30s) sugere problema de relevância ou UX"
  },
  conversions: {
    title: "Conversões",
    description: "Total de ações valiosas realizadas nesta página (WhatsApp, telefone, formulários, CTAs)",
    calculation: "Soma de todos os eventos de conversão (whatsapp_click, phone_click, email_click, etc.) originados desta página",
    interpretation: "Páginas com alta conversão são suas melhores performers comerciais"
  }
};
