export interface MetricExplanation {
  title: string;
  description: string;
  calculation: string;
  interpretation: string;
  benchmarks: {
    excellent: string;
    good: string;
    poor: string;
    critical: string;
  };
  action: string;
}

export const metricExplanations: Record<string, MetricExplanation> = {
  totalSessions: {
    title: "Total de Sessões",
    description: "Número total de visitas ao seu site no período selecionado. Cada vez que um usuário acessa seu site, uma nova sessão é criada.",
    calculation: "Conta todas as visitas únicas ao site, identificadas por session_id único",
    interpretation: "Quanto maior, mais tráfego você está recebendo. Acompanhe a evolução ao longo do tempo.",
    benchmarks: {
      excellent: "> 1.000/mês: Excelente tráfego",
      good: "500-1.000/mês: Bom volume",
      poor: "100-500/mês: Tráfego moderado",
      critical: "< 100/mês: Necessita estratégia de aquisição"
    },
    action: "Se baixo, invista em SEO, conteúdo e divulgação nas redes sociais."
  },
  
  uniqueVisitors: {
    title: "Usuários Únicos",
    description: "Número de pessoas diferentes que visitaram seu site. Um mesmo usuário pode criar várias sessões, mas é contado apenas uma vez.",
    calculation: "Conta IPs únicos ou identificadores de sessão únicos por visitante",
    interpretation: "Mostra o tamanho real da sua audiência, independente de quantas vezes cada um visitou.",
    benchmarks: {
      excellent: "> 80% das sessões: Alta diversidade",
      good: "60-80%: Boa variedade de visitantes",
      poor: "40-60%: Muitos retornos",
      critical: "< 40%: Base muito concentrada"
    },
    action: "Se baixo em relação às sessões, significa poucos visitantes muito ativos. Expanda sua base."
  },
  
  newVisitors: {
    title: "Novos Visitantes",
    description: "Usuários que estão visitando seu site pela primeira vez no período. Indica crescimento de audiência.",
    calculation: "Sessões sem histórico anterior de visitas do mesmo identificador",
    interpretation: "Alto percentual indica crescimento. Baixo pode significar estagnação ou boa retenção.",
    benchmarks: {
      excellent: "> 70%: Crescimento forte",
      good: "50-70%: Expansão saudável",
      poor: "30-50%: Crescimento lento",
      critical: "< 30%: Dependência de base existente"
    },
    action: "Se baixo, invista em campanhas de aquisição e novos canais de tráfego."
  },
  
  returningVisitors: {
    title: "Visitantes Retornantes",
    description: "Usuários que já visitaram seu site antes e voltaram. Indica qualidade do conteúdo e engajamento.",
    calculation: "Sessões com histórico de visitas anteriores",
    interpretation: "Alto percentual indica conteúdo relevante e audiência fiel. Importante para conversão.",
    benchmarks: {
      excellent: "> 40%: Excelente retenção",
      good: "25-40%: Boa fidelização",
      poor: "15-25%: Retenção baixa",
      critical: "< 15%: Problema de relevância"
    },
    action: "Se baixo, melhore qualidade do conteúdo, adicione recursos que incentivem retorno."
  },
  
  avgDuration: {
    title: "Duração Média da Sessão",
    description: "Tempo médio que os visitantes passam no seu site em cada visita. Indicador de engajamento e qualidade.",
    calculation: "Soma de tempo total de todas as sessões ÷ número de sessões",
    interpretation: "Sessões longas indicam interesse no conteúdo. Muito curtas sugerem problemas de relevância.",
    benchmarks: {
      excellent: "> 5 min: Altamente engajado",
      good: "2-5 min: Engajamento saudável",
      poor: "1-2 min: Baixo interesse",
      critical: "< 1 min: Alerta crítico"
    },
    action: "Se baixo, revise headlines, facilite navegação e melhore CTAs visíveis."
  },
  
  avgPagesPerSession: {
    title: "Páginas por Sessão",
    description: "Número médio de páginas que cada visitante visualiza durante sua visita. Mede profundidade de navegação.",
    calculation: "Total de páginas visitadas ÷ número de sessões",
    interpretation: "Quanto maior, melhor a navegação e mais interesse no site. Baixo indica conteúdo superficial.",
    benchmarks: {
      excellent: "> 4 páginas: Excelente exploração",
      good: "2.5-4: Boa navegação",
      poor: "1.5-2.5: Navegação limitada",
      critical: "< 1.5: Problema de conteúdo"
    },
    action: "Adicione links internos, conteúdo relacionado e navegação intuitiva."
  },
  
  engagementRate: {
    title: "Taxa de Engajamento",
    description: "Percentual de visitantes que interagiram com seu site (cliques, navegação, conversões). Inverso da taxa de rejeição.",
    calculation: "(1 - Taxa de Rejeição) × 100 = Visitantes que visualizaram 2+ páginas",
    interpretation: "Alto engajamento = visitantes interessados. Baixo = problema de relevância ou usabilidade.",
    benchmarks: {
      excellent: "> 60%: Conteúdo muito relevante",
      good: "40-60%: Engajamento saudável",
      poor: "20-40%: Melhorias necessárias",
      critical: "< 20%: Alerta vermelho"
    },
    action: "Melhore CTAs, facilite navegação, ajuste conteúdo à expectativa do visitante."
  },
  
  bounceRate: {
    title: "Taxa de Rejeição",
    description: "Percentual de visitantes que saem sem visualizar outras páginas. Sinal de desinteresse ou expectativa não atendida.",
    calculation: "(Sessões de 1 página única ÷ Total de sessões) × 100",
    interpretation: "Baixa rejeição = conteúdo relevante. Alta = revisar posicionamento, conteúdo ou usabilidade.",
    benchmarks: {
      excellent: "< 40%: Excelente retenção",
      good: "40-60%: Normal para maioria",
      poor: "60-80%: Revisar estratégia",
      critical: "> 80%: Problema grave"
    },
    action: "Se alta, verifique se página atende expectativa, melhore CTAs e links internos visíveis."
  }
};
