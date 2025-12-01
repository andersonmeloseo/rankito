export interface PageInsightExplanation {
  title: string;
  description: string;
  interpretation: string;
  action: string;
  color: 'success' | 'destructive' | 'default' | 'secondary';
}

export const pagePerformanceInsights: Record<string, PageInsightExplanation> = {
  champions: {
    title: "Páginas Campeãs",
    description: "Páginas que retêm visitantes por mais tempo, têm baixa taxa de rejeição e geram ações/conversões.",
    interpretation: "Estas páginas demonstram excelente engajamento do usuário. O conteúdo é relevante, os CTAs são visíveis e a experiência do usuário é positiva.",
    action: "Use o conteúdo e estrutura destas páginas como referência para melhorar outras páginas. Analise o que funciona bem: formatação, CTAs, velocidade de carregamento, e replique esses elementos.",
    color: 'success'
  },
  alerts: {
    title: "Páginas em Alerta",
    description: "Páginas com alta taxa de rejeição (>70%) ou tempo médio muito baixo (<10s), indicando problemas de engajamento.",
    interpretation: "Visitantes chegam mas saem rapidamente sem interagir. Pode indicar: conteúdo irrelevante, problemas de UX, velocidade lenta, ou expectativa não atendida.",
    action: "Priorize estas páginas para otimização: verifique velocidade de carregamento (PageSpeed Insights), revise relevância do conteúdo, melhore visibilidade dos CTAs, adicione elementos visuais, e teste diferentes versões do conteúdo.",
    color: 'destructive'
  },
  opportunities: {
    title: "Oportunidades de Otimização",
    description: "Páginas com alto tráfego mas baixa taxa de conversão. Há audiência, mas falta monetização/ação.",
    interpretation: "Estas páginas atraem visitantes mas não os convertem. O problema não é tráfego - é falta de CTAs claros, formulários pouco visíveis, ou proposta de valor fraca.",
    action: "Adicione CTAs mais proeminentes (botões de WhatsApp, formulários), teste diferentes posicionamentos de elementos de conversão, melhore a proposta de valor na página, e considere A/B testing.",
    color: 'default'
  },
  highConversion: {
    title: "Páginas de Alta Conversão",
    description: "Páginas com as maiores taxas de conversão - visitantes tomam ação com frequência.",
    interpretation: "Estas páginas são suas melhores performers para geração de leads/vendas. O tráfego que chega está altamente qualificado e o conteúdo é persuasivo.",
    action: "Direcione mais tráfego para estas páginas através de links internos, anúncios, e SEO. Considere criar variações destas páginas para outros nichos/produtos mantendo a estrutura que funciona.",
    color: 'secondary'
  }
};
