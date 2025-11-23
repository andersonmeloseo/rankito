export type LandingLocale = 'pt-BR' | 'es-ES' | 'en-US' | 'fr-FR' | 'pt-PT';

export interface LandingTranslations {
  nav: {
    features: string;
    gsc: string;
    pricing: string;
    faq: string;
    login: string;
    startFree: string;
  };
  hero: {
    badge: string;
    title: string;
    painPoint: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    socialProof: {
      sites: string;
      revenue: string;
      secure: string;
    };
  };
  problems: {
    title: string;
    items: string[];
    conclusion: string;
  };
  features: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
      benefits: string[];
      badge?: string;
    }>;
  };
  gsc: {
    badge: string;
    title: string;
    painPoint: string;
    description: string;
    ctaButton: string;
    features: Array<{
      title: string;
      description: string;
    }>;
  };
  ecommerce: {
    badge: string;
    title: string;
    painPoint: string;
    description: string;
    ctaButton: string;
    highlight: string;
    features: Array<{
      title: string;
      description: string;
    }>;
  };
  userJourney: {
    badge: string;
    title: string;
    painPoint: string;
    description: string;
    ctaButton: string;
    highlight: string;
    features: Array<{
      title: string;
      description: string;
    }>;
  };
  pricing: {
    badge: string;
    title: string;
    description: string;
    perMonth: string;
    freeDays: string;
    popular: string;
    subscribe: string;
    upTo: string;
    unlimited: string;
    sites: string;
    pages: string;
    integrations: string;
    commonFeatures: string[];
    footer: string;
  };
  testimonials: {
    badge: string;
    title: string;
    description: string;
    items: Array<{
      name: string;
      role: string;
      text: string;
      category: string;
    }>;
  };
  faq: {
    badge: string;
    title: string;
    description: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  cta: {
    title: string;
    description: string;
    button: string;
    features: string[];
  };
  footer: {
    product: {
      title: string;
      features: string;
      pricing: string;
      start: string;
      gsc: string;
    };
    resources: {
      title: string;
      docs: string;
      tutorials: string;
      blog: string;
      faq: string;
    };
    company: {
      title: string;
      about: string;
      privacy: string;
      terms: string;
      contact: string;
    };
    support: {
      title: string;
      help: string;
      status: string;
      email: string;
      whatsapp: string;
    };
    copyright: string;
  };
  whoIsItFor: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
    profiles: Array<{
      title: string;
      description: string;
      example: string;
    }>;
  };
  comparison: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
    footer: string;
    headers: {
      feature: string;
      googleAnalytics: string;
      semrushAhrefs: string;
      agencyAnalytics: string;
      rankito: string;
    };
    rows: Array<{
      feature: string;
      googleAnalytics: { status: 'yes' | 'no' | 'partial'; text: string };
      semrushAhrefs: { status: 'yes' | 'no' | 'partial'; text: string };
      agencyAnalytics: { status: 'yes' | 'no' | 'partial'; text: string };
      rankito: { status: 'yes' | 'no' | 'partial'; text: string };
    }>;
  };
  pillars: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  roiCalculator: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
    ctaSubtext: string;
    inputs: {
      sites: {
        label: string;
        description: string;
      };
      hours: {
        label: string;
        description: string;
      };
      rate: {
        label: string;
        description: string;
      };
    };
    results: {
      title: string;
      monthlySavings: string;
      timeSaved: string;
      month: string;
      week: string;
      yearlyROI: string;
      roiPercentage: string;
      netProfit: string;
    };
    calculationLogic: {
      title: string;
      steps: {
        timePerSite: {
          title: string;
        };
        hoursSaved: {
          title: string;
          description: string;
        };
        monthlySavings: {
          title: string;
          weeks: string;
        };
        rankitoCost: {
          title: string;
          plan: string;
        };
        netProfit: {
          title: string;
        };
      };
      footer: string;
    };
  };
}

export const landingTranslations: Record<LandingLocale, LandingTranslations> = {
  'pt-BR': {
    nav: {
      features: 'Funcionalidades',
      gsc: 'Indexação GSC',
      pricing: 'Preços',
      faq: 'FAQ',
      login: 'Entrar',
      startFree: 'Começar Grátis',
    },
    hero: {
      badge: 'Rank & Rent CRM',
      title: 'Gerencie Seu Império de Rank & Rent com Inteligência',
      painPoint: 'Pare de perder dinheiro com sites sem controle, conversões invisíveis e indexação manual que consome seu tempo.',
      description: 'A única plataforma completa para profissionais de SEO que gerenciam portfólios de sites de lead generation. Centralize gestão, financeiro, CRM e indexação automática em um só lugar.',
      ctaPrimary: 'Comece Grátis Agora',
      ctaSecondary: 'Ver Demonstração',
      socialProof: {
        sites: '200+ sites gerenciados',
        revenue: 'R$ 500K+ em receita',
        secure: 'Dados 100% seguros',
      },
    },
    problems: {
      title: 'Reconhece Esses Problemas?',
      items: [
        'Sites parados sem saber quais estão convertendo',
        'Páginas criadas mas não indexadas pelo Google',
        'Horas perdidas em planilhas desorganizadas',
        'Cliente pede relatório e você não tem dados',
        'Leads ligam e você anota no papel',
        'Sem saber o ROI real de cada projeto',
      ],
      conclusion: '👉 O Rankito CRM resolve TODOS esses problemas em uma única plataforma.',
    },
    features: {
      badge: 'Funcionalidades',
      title: 'Tudo Que Você Precisa em Uma Plataforma',
      subtitle: 'Gerencie seu portfólio com ferramentas profissionais',
      items: [
        {
          title: 'Dashboard Inteligente',
          description: 'Você não sabe quais sites estão convertendo e perdendo dinheiro? Acompanhe performance, receita, custos e ROI de todos os seus sites em tempo real. Métricas que importam, sem ruído.',
          benefits: [
            'Visão geral de todos os sites',
            'Receita e custos em tempo real',
            'ROI automático por projeto',
            'Alertas de performance',
          ],
          badge: 'Essencial',
        },
        {
          title: 'CRM Completo',
          description: 'Leads ligam, você anota no papel e esquece de retornar? Capture leads automaticamente, gerencie deals, automatize follow-ups e nunca mais perca uma oportunidade de negócio.',
          benefits: [
            'Pipeline visual de vendas',
            'Automação de follow-ups',
            'Histórico completo de interações',
            'Integração com WhatsApp',
          ],
        },
        {
          title: 'Indexação Automática GSC',
          description: 'Cansado de indexar 5 páginas por vez manualmente no Search Console? Conecte sua conta Google e indexe centenas de páginas automaticamente. Envie sitemaps, agende indexações e monitore status em tempo real.',
          benefits: [
            'Indexação em massa (200+ URLs/dia)',
            'Agendamento automático',
            'Monitoramento de status',
            'Múltiplas contas GSC',
          ],
          badge: 'Exclusivo',
        },
        {
          title: 'E-commerce Tracking',
          description: 'Rastreie vendas, produtos e receita diretamente nos seus sites com tracking completo de e-commerce.',
          benefits: [
            'Plataforma pioneira com tracking de e-commerce completo',
            'Rastreamento automático de visualizações de produtos',
            'Captura de adições ao carrinho e checkouts',
            'Atribuição de receita por produto e página',
            'Funil completo: visualização → carrinho → compra',
            'Integração com Shopify, WooCommerce e sites HTML'
          ],
          badge: '🌍 Pioneira Mundial',
        },
        {
          title: 'Financeiro Completo',
          description: 'Planilhas desorganizadas e sem saber se está lucrando ou perdendo? Registre receitas, custos, pagamentos e calcule ROI automaticamente. Saiba exatamente quanto cada site está gerando.',
          benefits: [
            'Controle de receitas e despesas',
            'ROI automático por site',
            'Histórico de pagamentos',
            'Projeções financeiras',
          ],
        },
        {
          title: 'Portal Whitelabel',
          description: 'Cliente pediu relatório e você não tem nada para mostrar? Gere portais personalizados com sua logo e cores. Seus clientes acompanham performance sem acessar seu dashboard.',
          benefits: [
            'Customização completa (logo, cores)',
            'Acesso seguro por link único',
            'Métricas em tempo real',
            'Relatórios automáticos',
          ],
        },
        {
          title: 'Analytics Avançado',
          description: 'Não sabe quantos leads cada página gerou hoje? Saiba quantos leads cada página gera, de onde vêm, quando acontecem. Tracking pixel + integração WordPress.',
          benefits: [
            'Tracking de conversões por página',
            'Origem de tráfego detalhada',
            'Horários de pico',
            'Plugin WordPress incluso',
          ],
        },
        {
          title: 'Jornada do Usuário',
          description: 'Não sabe por onde seus visitantes navegam nem onde desistem? Rastreie cada passo da jornada do cliente - da entrada até a saída - com precisão de sniper. Veja sequências completas, tempo gasto por página e identifique gargalos no funil.',
          benefits: [
            'Sequências completas de navegação página por página',
            'Tempo real gasto em cada etapa da jornada',
            'Identificação de bounce sessions e páginas problemáticas',
            'Análise comportamental de padrões de navegação',
            'Filtros inteligentes por volume de sessões',
          ],
        },
      ],
    },
    gsc: {
      badge: 'Chega de Perder Tempo',
      title: 'Pare de Indexar 5 Páginas Por Vez Manualmente',
      painPoint: 'Você tem 500 páginas criadas mas o Google só indexou 50? Está perdendo dinheiro todos os dias enquanto suas páginas ficam invisíveis.',
      description: 'Nossa indexação automática conecta ao Google Search Console e indexa centenas de páginas por dia. Sem esforço manual, sem perder oportunidades.',
      ctaButton: 'Começar a Indexar Agora',
      features: [
        {
          title: 'Indexação em Massa',
          description: 'Envie até 200 URLs por dia automaticamente para o Google Search Console. Multiplique isso por quantas contas você conectar.',
        },
        {
          title: 'Agendamento Inteligente',
          description: 'Configure horários automáticos para submissão de sitemaps. O sistema gerencia tudo sem você precisar lembrar.',
        },
        {
          title: 'Monitoramento em Tempo Real',
          description: 'Acompanhe o status de cada URL: pendente, indexado, erro. Saiba exatamente o que está acontecendo com suas páginas.',
        },
      ],
    },
    ecommerce: {
      badge: '🎯 Monitoramento Total',
      title: 'Rastreie Cada Clique e Indexe Todas as Páginas Automaticamente',
      painPoint: 'Seu site tem páginas invisíveis no Google? Não sabe quantos cliques cada produto recebe? Perde vendas porque produtos não aparecem nas buscas?',
      description: 'Monitore TODOS os cliques, visualizações e ações nas páginas dos seus sites. Indexe automaticamente no Google e Bing para máxima visibilidade. Tenha clareza total do funil de conversão em tempo real.',
      ctaButton: 'Começar Monitoramento Completo',
      highlight: '🏆 MONITORAMENTO PERFEITO DE CLIQUES + INDEXAÇÃO AUTOMÁTICA = ZERO PÁGINAS INVISÍVEIS + VISÃO CLARA DO FUNIL',
      features: [
        {
          title: 'Monitoramento de Todos os Cliques',
          description: 'Rastreie cada clique, visualização de produto, adição ao carrinho e conversão. Saiba exatamente como visitantes interagem com suas páginas.',
        },
        {
          title: 'Indexação Automática Google + Bing',
          description: 'Todas as páginas são enviadas automaticamente para indexação. Zero páginas invisíveis nas buscas. Máxima cobertura orgânica sem trabalho manual.',
        },
        {
          title: 'Funil Completo de Conversão',
          description: 'Visualize toda a jornada: Visualização → Interesse → Ação → Conversão. Identifique exatamente onde visitantes abandonam e otimize.',
        },
        {
          title: 'Clareza Total em Tempo Real',
          description: 'Dashboard mostra páginas mais clicadas, taxa de conversão por página, horários de pico, origem de tráfego e receita detalhada.',
        },
        {
          title: 'Funciona em Qualquer Plataforma',
          description: 'Compatível com Shopify, WooCommerce, WordPress e qualquer HTML. Pixel universal que rastreia tudo sem precisar configuração complexa.',
        },
      ],
    },
    userJourney: {
      badge: '🎯 Rastreamento Inteligente',
      title: 'Veja a Jornada Completa dos Seus Visitantes com Precisão de Sniper',
      painPoint: 'Você sabe EXATAMENTE quais páginas seus visitantes acessam, por quanto tempo ficam, e onde saem? Ou está no escuro?',
      description: 'Sistema de rastreamento avançado que captura cada passo da jornada do usuário - desde a primeira página até a conversão ou saída - com precisão milimétrica.',
      ctaButton: 'Ver Jornada em Ação',
      highlight: 'Descubra ONDE seus visitantes estão desistindo e OTIMIZE seu funil com dados reais',
      features: [
        {
          title: 'Sequências Completas',
          description: 'Veja o caminho exato que cada visitante faz: Home (2m34s) → Serviços (45s) → Contato (1m12s). Não é só "X pageviews", é a jornada completa.',
        },
        {
          title: 'Tempo Real por Página',
          description: 'Cada segundo contabilizado. Saiba exatamente quanto tempo os visitantes gastam em cada etapa do funil. Precisão milimétrica.',
        },
        {
          title: 'Análise Comportamental',
          description: 'Identifique padrões de navegação mais comuns. Descubra as sequências que levam à conversão e as que levam à desistência.',
        },
        {
          title: 'Bounce Sessions',
          description: 'Visualize páginas com alta taxa de saída. Entenda onde 80% dos visitantes estão abandonando seu funil e corrija com dados reais.',
        },
      ],
    },
    pricing: {
      badge: 'Preços',
      title: 'Planos Para Todos os Tamanhos',
      description: 'Escolha o plano ideal para o tamanho do seu portfólio',
      perMonth: '/mês',
      freeDays: 'dias grátis',
      popular: 'Mais Popular',
      subscribe: 'Assinar',
      upTo: 'Até',
      unlimited: 'Ilimitado',
      sites: 'sites',
      pages: 'páginas por site',
      integrations: 'integrações GSC',
      commonFeatures: [
        'CRM completo',
        'Portal whitelabel',
        'Analytics avançado',
        'Financeiro completo',
        'Suporte prioritário',
      ],
      footer: '*Todos os planos incluem suporte técnico e atualizações gratuitas',
    },
    testimonials: {
      badge: 'Depoimentos',
      title: 'O Que Nossos Clientes Dizem',
      description: 'Profissionais de SEO que transformaram seus negócios com Rankito CRM',
      items: [
        {
          name: 'Carlos Silva',
          role: 'CEO, Agência Digital Pro',
          text: 'Rankito CRM mudou completamente como gerenciamos nosso portfólio de 30+ sites. A indexação automática no GSC economiza 8 horas por semana.',
          category: 'Agência SEO',
        },
        {
          name: 'Marina Santos',
          role: 'Consultora SEO',
          text: 'Finalmente tenho controle financeiro total sobre meus projetos. O ROI automático e o portal whitelabel impressionam meus clientes.',
          category: 'Consultora',
        },
        {
          name: 'Ricardo Oliveira',
          role: 'Head de Growth',
          text: 'A integração com Google Search Console é simplesmente incrível. Nenhuma outra plataforma oferece isso de forma tão profissional.',
          category: 'Startup',
        },
        {
          name: 'Juliana Costa',
          role: 'Fundadora, LeadGen Brasil',
          text: 'O CRM integrado me ajudou a fechar 40% mais contratos. Não perco mais nenhum lead e o pipeline é cristalino.',
          category: 'Agência Lead Gen',
        },
        {
          name: 'Pedro Alves',
          role: 'Especialista Rank & Rent',
          text: 'Gerencio 50 sites com facilidade. O tracking de conversões e os relatórios automáticos economizam dias de trabalho manual.',
          category: 'Especialista',
        },
        {
          name: 'Ana Paula',
          role: 'Diretora de Marketing',
          text: 'O portal do cliente é perfeito. Meus clientes adoram a transparência e eu não preciso mais enviar relatórios manuais.',
          category: 'Marketing',
        },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Perguntas Frequentes',
      description: 'Tire suas dúvidas sobre o Rankito CRM',
      items: [
        {
          question: 'Como funciona a integração com Google Search Console?',
          answer: 'Você conecta suas contas do GSC usando Service Account do Google Cloud. O sistema gerencia automaticamente a submissão de URLs e sitemaps, respeitando os limites diários do Google (200 URLs/dia por conta).',
        },
        {
          question: 'Posso conectar múltiplas contas do Google Search Console?',
          answer: 'Sim! Dependendo do seu plano, você pode conectar múltiplas contas GSC. Isso multiplica sua capacidade de indexação diária. Por exemplo, com 5 contas, você pode indexar até 1000 URLs por dia.',
        },
        {
          question: 'O portal whitelabel é realmente personalizável?',
          answer: 'Sim! Você pode adicionar sua logo, definir cores primárias e secundárias, personalizar textos de boas-vindas e até configurar informações de contato. Cada cliente tem seu próprio link único e seguro.',
        },
        {
          question: 'Como funciona o tracking de conversões?',
          answer: 'Oferecemos um plugin WordPress que instala um pixel de tracking em suas páginas. Ele registra visualizações, cliques em WhatsApp, telefones e formulários. Tudo aparece em tempo real no dashboard.',
        },
        {
          question: 'Posso testar antes de assinar?',
          answer: 'Sim! Todos os planos pagos incluem período de trial gratuito. Free (0 dias), Starter (7 dias), Professional (14 dias), Enterprise (30 dias). Não precisa cartão de crédito para começar.',
        },
        {
          question: 'Vocês têm suporte em português?',
          answer: 'Sim! Todo nosso suporte é em português, incluindo documentação, tutoriais em vídeo e atendimento por email/WhatsApp. Respondemos em até 24 horas.',
        },
      ],
    },
    cta: {
      title: 'Pronto Para Gerenciar Seu Império Rank & Rent?',
      description: 'Junte-se a centenas de profissionais de SEO que já transformaram seus negócios',
      button: 'Começar Trial Gratuito de 7 Dias',
      features: [
        'Sem cartão de crédito',
        'Cancele quando quiser',
        'Suporte dedicado',
      ],
    },
    footer: {
      product: {
        title: 'Produto',
        features: 'Funcionalidades',
        pricing: 'Preços',
        start: 'Começar Agora',
        gsc: 'Indexação GSC',
      },
      resources: {
        title: 'Recursos',
        docs: 'Documentação',
        tutorials: 'Tutoriais',
        blog: 'Blog',
        faq: 'FAQ',
      },
      company: {
        title: 'Empresa',
        about: 'Sobre Nós',
        privacy: 'Política de Privacidade',
        terms: 'Termos de Uso',
        contact: 'Contato',
      },
      support: {
        title: 'Suporte',
        help: 'Central de Ajuda',
        status: 'Status do Sistema',
        email: 'contato@rankitocrm.com',
        whatsapp: '(11) 99999-9999',
      },
      copyright: '© 2024 Rankito CRM. Todos os direitos reservados.',
    },
    whoIsItFor: {
      badge: 'Público-Alvo',
      title: 'Para Quem é o Rankito CRM?',
      subtitle: 'Solução completa para diferentes perfis de profissionais que gerenciam sites',
      cta: 'Comece Grátis',
      profiles: [
        {
          title: 'Agências de Marketing Digital',
          description: 'Você gerencia dezenas de sites para clientes locais, mas Google Analytics é complexo demais e seus clientes não entendem relatórios técnicos. Com Rankito, você gera relatórios visuais automáticos que contam uma história clara - seus clientes finalmente entendem o ROI e renovam contratos.',
          example: 'Gerencio 10-50 sites de clientes locais e preciso de relatórios que façam sentido para eles',
        },
        {
          title: 'Consultores SEO Freelancers',
          description: 'Você gerencia 5 a 15 sites sozinho e perde horas criando relatórios manuais em planilhas. Com Rankito, você automatiza todo o reporting e ganha um portal do cliente whitelabel - enquanto você dorme, seus clientes acompanham a performance ao vivo.',
          example: 'Gerencio 5-15 sites sozinho e preciso automatizar o reporting',
        },
        {
          title: 'Profissionais de Lead Generation',
          description: 'Seus sites geram leads constantemente, mas você não tem visibilidade clara de qual página converte mais, qual horário é pico e quanto cada projeto realmente lucra. Rankito entrega CRM simples + tracking preciso + indexação automática - você vê exatamente o que funciona e escala o que dá resultado.',
          example: 'Meus sites rank & rent geram leads diariamente mas não sei o ROI exato de cada projeto',
        },
        {
          title: 'Pequenos E-commerces',
          description: 'Você tem 50 a 500 produtos na loja, mas não sabe quais realmente convertem nem onde os clientes abandonam o carrinho. Com Rankito, você vê analytics de produto detalhado e funil visual completo - identifica gargalos e otimiza vendas com dados reais, não achismos.',
          example: 'Tenho loja online mas não sei qual produto vende mais e por quê',
        },
        {
          title: 'Gestores de Portfólio',
          description: 'Você investe em 20+ sites diferentes e gerenciar tudo manualmente virou caos total - planilhas quebradas, sem saber ROI real de cada projeto. Rankito consolida tudo em um dashboard único com ROI automático por projeto - você finalmente sabe onde colocar mais dinheiro e onde cortar.',
          example: 'Invisto em múltiplos sites mas preciso de visão consolidada do portfólio',
        },
      ],
    },
    comparison: {
      badge: 'Por Que Rankito?',
      title: 'A Plataforma Que Faz o Que Outras Só Prometem',
      subtitle: 'Compare funcionalidades lado a lado',
      cta: 'Experimente Grátis por 14 Dias',
      footer: '*Google Analytics é grátis, mas você perde 10h/semana tentando entender',
      headers: {
        feature: 'Recurso',
        googleAnalytics: 'Google Analytics',
        semrushAhrefs: 'SEMrush/Ahrefs',
        agencyAnalytics: 'AgencyAnalytics',
        rankito: 'Rankito CRM',
      },
      rows: [
        {
          feature: 'Complexidade',
          googleAnalytics: { status: 'no', text: 'Alta curva aprendizado' },
          semrushAhrefs: { status: 'no', text: 'Interface técnica' },
          agencyAnalytics: { status: 'partial', text: 'Focado SEO' },
          rankito: { status: 'yes', text: 'Simples e visual' },
        },
        {
          feature: 'Jornada Usuário',
          googleAnalytics: { status: 'no', text: 'Fluxos confusos' },
          semrushAhrefs: { status: 'no', text: 'Não tem' },
          agencyAnalytics: { status: 'no', text: 'Não tem' },
          rankito: { status: 'yes', text: 'Página por página' },
        },
        {
          feature: 'E-commerce',
          googleAnalytics: { status: 'partial', text: 'Setup complexo' },
          semrushAhrefs: { status: 'no', text: 'Só keywords' },
          agencyAnalytics: { status: 'no', text: 'Não tem' },
          rankito: { status: 'yes', text: 'Automático' },
        },
        {
          feature: 'Indexação GSC',
          googleAnalytics: { status: 'no', text: 'Não tem' },
          semrushAhrefs: { status: 'partial', text: 'Só monitora' },
          agencyAnalytics: { status: 'no', text: 'Não tem' },
          rankito: { status: 'yes', text: 'Automação completa' },
        },
        {
          feature: 'Portal Cliente',
          googleAnalytics: { status: 'no', text: 'Não tem' },
          semrushAhrefs: { status: 'no', text: 'Não tem' },
          agencyAnalytics: { status: 'yes', text: 'Tem' },
          rankito: { status: 'yes', text: 'Whitelabel' },
        },
        {
          feature: 'CRM Integrado',
          googleAnalytics: { status: 'no', text: 'Não tem' },
          semrushAhrefs: { status: 'no', text: 'Não tem' },
          agencyAnalytics: { status: 'no', text: 'Não tem' },
          rankito: { status: 'yes', text: 'Pipeline + leads' },
        },
        {
          feature: 'Relatórios',
          googleAnalytics: { status: 'no', text: 'Você cria' },
          semrushAhrefs: { status: 'partial', text: 'Exporta dados' },
          agencyAnalytics: { status: 'yes', text: 'Tem' },
          rankito: { status: 'yes', text: 'Automáticos' },
        },
        {
          feature: 'Preço/mês',
          googleAnalytics: { status: 'partial', text: 'Grátis*' },
          semrushAhrefs: { status: 'no', text: 'R$ 500-2000' },
          agencyAnalytics: { status: 'no', text: 'R$ 400-800' },
          rankito: { status: 'yes', text: 'R$ 97-797' },
        },
      ],
    },
    pillars: {
      badge: 'Nossa Filosofia',
      title: 'O Que Nos Torna Diferentes',
      subtitle: 'Princípios que guiam cada funcionalidade que criamos',
      items: [
        {
          title: 'Clareza, Não Complexidade',
          description: 'Google Analytics mostra 47 métricas. Você precisa de 5 que importam. Relatórios que seu cliente ENTENDE, não tabelas que ninguém lê.',
        },
        {
          title: 'Ação, Não Apenas Dados',
          description: 'Outras ferramentas mostram dados. Rankito mostra O QUE FAZER. Não é só ver números, é indexar, acompanhar jornada, fechar leads.',
        },
        {
          title: 'Automação Total',
          description: 'Pare de gastar 6 horas criando relatórios. Gere em 2 cliques. Indexação que roda sozinha. CRM que captura leads automaticamente.',
        },
        {
          title: 'Tudo em Um Só Lugar',
          description: 'Analytics + CRM + Financeiro + Portal Cliente + Indexação GSC. Uma mensalidade, zero integrações quebradas.',
        },
      ],
    },
    roiCalculator: {
      badge: 'Calculadora de Economia',
      title: 'Quanto Você Está Perdendo Sem Rankito?',
      subtitle: 'Calcule sua economia mensal em tempo e dinheiro',
      cta: 'Comece a Economizar Agora - 14 Dias Grátis',
      ctaSubtext: 'Sem cartão de crédito. Cancele quando quiser.',
      inputs: {
        sites: {
          label: 'Quantos sites você gerencia?',
          description: 'Número total de sites/projetos sob sua gestão',
        },
        hours: {
          label: 'Quantas horas/semana gasta em tarefas manuais?',
          description: 'Relatórios, indexação, análise de dados, etc.',
        },
        rate: {
          label: 'Quanto vale sua hora? (R$)',
          description: 'Valor médio por hora do seu trabalho',
        },
      },
      results: {
        title: 'Sua Economia com Rankito:',
        monthlySavings: 'Economia Mensal Bruta',
        timeSaved: 'Tempo Economizado',
        month: 'mês',
        week: 'semana',
        yearlyROI: 'ROI em 12 Meses',
        roiPercentage: 'Retorno sobre Investimento',
        netProfit: 'Lucro Líquido Mensal',
      },
      calculationLogic: {
        title: 'Como Calculamos?',
        steps: {
          timePerSite: { title: 'Tempo por site' },
          hoursSaved: { title: 'Horas economizadas', description: 'de trabalho manual eliminado' },
          monthlySavings: { title: 'Economia mensal bruta', weeks: 'semanas' },
          rankitoCost: { title: 'Custo Rankito', plan: 'Plano Professional' },
          netProfit: { title: 'Lucro líquido mensal' },
        },
        footer: 'Em 12 meses você economiza {total} ({percentage}% de ROI)',
      },
    },
  },
  'es-ES': {
    nav: {
      features: 'Funcionalidades',
      gsc: 'Indexación GSC',
      pricing: 'Precios',
      faq: 'FAQ',
      login: 'Iniciar Sesión',
      startFree: 'Empezar Gratis',
    },
    hero: {
      badge: 'Rank & Rent CRM',
      title: 'Gestiona Tu Imperio de Rank & Rent con Inteligencia',
      painPoint: 'Deja de perder dinero con sitios sin control, conversiones invisibles e indexación manual que consume tu tiempo.',
      description: 'La única plataforma completa para profesionales de SEO que gestionan carteras de sitios de generación de leads. Centraliza gestión, finanzas, CRM e indexación automática en un solo lugar.',
      ctaPrimary: 'Empezar Gratis Ahora',
      ctaSecondary: 'Ver Demostración',
      socialProof: {
        sites: '200+ sitios gestionados',
        revenue: '€120K+ en ingresos',
        secure: 'Datos 100% seguros',
      },
    },
    problems: {
      title: '¿Reconoces Estos Problemas?',
      items: [
        'Sitios parados sin saber cuáles están convirtiendo',
        'Páginas creadas pero no indexadas por Google',
        'Horas perdidas en hojas de cálculo desorganizadas',
        'Cliente pide informe y no tienes datos',
        'Leads llaman y anotas en papel',
        'Sin saber el ROI real de cada proyecto',
      ],
      conclusion: '👉 Rankito CRM resuelve TODOS estos problemas en una única plataforma.',
    },
    features: {
      badge: 'Funcionalidades',
      title: 'Todo Lo Que Necesitas en Una Plataforma',
      subtitle: 'Gestiona tu cartera con herramientas profesionales',
      items: [
        {
          title: 'Panel Inteligente',
          description: '¿No sabes qué sitios están convirtiendo y perdiendo dinero? Monitorea rendimiento, ingresos, costos y ROI de todos tus sitios en tiempo real. Métricas que importan, sin ruido.',
          benefits: [
            'Vista general de todos los sitios',
            'Ingresos y costos en tiempo real',
            'ROI automático por proyecto',
            'Alertas de rendimiento',
          ],
          badge: 'Esencial',
        },
        {
          title: 'CRM Completo',
          description: '¿Los leads llaman, anotas en papel y olvidas devolver la llamada? Captura leads automáticamente, gestiona deals, automatiza seguimientos y nunca más pierdas una oportunidad de negocio.',
          benefits: [
            'Pipeline visual de ventas',
            'Automatización de seguimientos',
            'Historial completo de interacciones',
            'Integración con WhatsApp',
          ],
        },
        {
          title: 'Indexación Automática GSC',
          description: '¿Cansado de indexar 5 páginas a la vez manualmente en Search Console? Conecta tu cuenta de Google e indexa cientos de páginas automáticamente. Envía sitemaps, programa indexaciones y monitorea el estado en tiempo real.',
          benefits: [
            'Indexación masiva (200+ URLs/día)',
            'Programación automática',
            'Monitoreo de estado',
            'Múltiples cuentas GSC',
          ],
          badge: 'Exclusivo',
        },
        {
          title: 'E-commerce Tracking',
          description: 'Rastrea ventas, productos e ingresos directamente en tus sitios con tracking completo de e-commerce.',
          benefits: [
            'Plataforma pionera con tracking de e-commerce completo',
            'Rastreo automático de visualizaciones de productos',
            'Captura de adiciones al carrito y checkouts',
            'Atribución de ingresos por producto y página',
            'Embudo completo: visualización → carrito → compra',
            'Integración con Shopify, WooCommerce y sitios HTML'
          ],
          badge: '🌍 Primera Mundial',
        },
        {
          title: 'Financiero Completo',
          description: '¿Hojas de cálculo desorganizadas y sin saber si estás ganando o perdiendo? Registra ingresos, costos, pagos y calcula el ROI automáticamente. Sabe exactamente cuánto está generando cada sitio.',
          benefits: [
            'Control de ingresos y gastos',
            'ROI automático por sitio',
            'Historial de pagos',
            'Proyecciones financieras',
          ],
        },
        {
          title: 'Portal Whitelabel',
          description: '¿Cliente pidió informe y no tienes nada que mostrar? Genera portales personalizados con tu logo y colores. Tus clientes monitorizan rendimiento sin acceder a tu panel.',
          benefits: [
            'Personalización completa (logo, colores)',
            'Acceso seguro por enlace único',
            'Métricas en tiempo real',
            'Informes automáticos',
          ],
        },
        {
          title: 'Analytics Avanzado',
          description: '¿No sabes cuántos leads generó cada página hoy? Descubre cuántos leads genera cada página, de dónde vienen, cuándo ocurren. Pixel de seguimiento + integración WordPress.',
          benefits: [
            'Seguimiento de conversiones por página',
            'Origen de tráfico detallado',
            'Horarios pico',
            'Plugin WordPress incluido',
          ],
        },
        {
          title: 'Recorrido del Usuario',
          description: '¿No sabes por dónde navegan tus visitantes ni dónde abandonan? Rastrea cada paso del recorrido del cliente - desde la entrada hasta la salida - con precisión de francotirador. Ve secuencias completas, tiempo invertido por página e identifica cuellos de botella en el embudo.',
          benefits: [
            'Secuencias completas de navegación página por página',
            'Tiempo real invertido en cada etapa del recorrido',
            'Identificación de bounce sessions y páginas problemáticas',
            'Análisis comportamental de patrones de navegación',
            'Filtros inteligentes por volumen de sesiones',
          ],
        },
      ],
    },
    gsc: {
      badge: 'Deja de Perder Tiempo',
      title: 'Deja de Indexar 5 Páginas a la Vez Manualmente',
      painPoint: '¿Tienes 500 páginas creadas pero Google solo indexó 50? Estás perdiendo dinero todos los días mientras tus páginas permanecen invisibles.',
      description: 'Nuestra indexación automática se conecta a Google Search Console e indexa cientos de páginas por día. Sin esfuerzo manual, sin perder oportunidades.',
      ctaButton: 'Empezar a Indexar Ahora',
      features: [
        {
          title: 'Indexación Masiva',
          description: 'Envía hasta 200 URLs por día automáticamente a Google Search Console. Multiplica esto por cuantas cuentas conectes.',
        },
        {
          title: 'Programación Inteligente',
          description: 'Configura horarios automáticos para envío de sitemaps. El sistema gestiona todo sin que tengas que recordarlo.',
        },
        {
          title: 'Monitoreo en Tiempo Real',
          description: 'Monitorea el estado de cada URL: pendiente, indexada, error. Sabe exactamente qué está pasando con tus páginas.',
        },
      ],
    },
    ecommerce: {
      badge: '🎯 Monitoreo Total',
      title: 'Rastrea Cada Clic e Indexa Todas las Páginas Automáticamente',
      painPoint: '¿Tu sitio tiene páginas invisibles en Google? ¿No sabes cuántos clics recibe cada producto? ¿Pierdes ventas porque los productos no aparecen en búsquedas?',
      description: 'Monitorea TODOS los clics, visualizaciones y acciones en las páginas de tus sitios. Indexa automáticamente en Google y Bing para máxima visibilidad. Ten claridad total del embudo de conversión en tiempo real.',
      ctaButton: 'Empezar Monitoreo Completo',
      highlight: '🏆 MONITOREO PERFECTO DE CLICS + INDEXACIÓN AUTOMÁTICA = CERO PÁGINAS INVISIBLES + VISIÓN CLARA DEL EMBUDO',
      features: [
        {
          title: 'Monitoreo de Todos los Clics',
          description: 'Rastrea cada clic, visualización de producto, añadido al carrito y conversión. Sabe exactamente cómo los visitantes interactúan con tus páginas.',
        },
        {
          title: 'Indexación Automática Google + Bing',
          description: 'Todas las páginas se envían automáticamente para indexación. Cero páginas invisibles en búsquedas. Máxima cobertura orgánica sin trabajo manual.',
        },
        {
          title: 'Embudo Completo de Conversión',
          description: 'Visualiza todo el recorrido: Visualización → Interés → Acción → Conversión. Identifica exactamente dónde los visitantes abandonan y optimiza.',
        },
        {
          title: 'Claridad Total en Tiempo Real',
          description: 'Dashboard muestra páginas más clicadas, tasa de conversión por página, horarios pico, origen de tráfico e ingresos detallados.',
        },
        {
          title: 'Funciona en Cualquier Plataforma',
          description: 'Compatible con Shopify, WooCommerce, WordPress y cualquier HTML. Pixel universal que rastrea todo sin necesitar configuración compleja.',
        },
      ],
    },
    userJourney: {
      badge: '🎯 Rastreo Inteligente',
      title: 'Ve el Recorrido Completo de Tus Visitantes con Precisión de Francotirador',
      painPoint: '¿Sabes EXACTAMENTE qué páginas visitan tus usuarios, cuánto tiempo se quedan y dónde salen? ¿O estás a oscuras?',
      description: 'Sistema de rastreo avanzado que captura cada paso del recorrido del usuario - desde la primera página hasta la conversión o salida - con precisión milimétrica.',
      ctaButton: 'Ver Recorrido en Acción',
      highlight: 'Descubre DÓNDE tus visitantes están abandonando y OPTIMIZA tu embudo con datos reales',
      features: [
        {
          title: 'Secuencias Completas',
          description: 'Ve el camino exacto de cada visitante: Inicio (2m34s) → Servicios (45s) → Contacto (1m12s). No solo "X pageviews", es el recorrido completo.',
        },
        {
          title: 'Tiempo Real por Página',
          description: 'Cada segundo contabilizado. Sabe exactamente cuánto tiempo los visitantes gastan en cada etapa del embudo. Precisión milimétrica.',
        },
        {
          title: 'Análisis de Comportamiento',
          description: 'Identifica patrones de navegación más comunes. Descubre las secuencias que llevan a la conversión y las que llevan al abandono.',
        },
        {
          title: 'Sesiones de Rebote',
          description: 'Visualiza páginas con alta tasa de salida. Entiende dónde el 80% de los visitantes está abandonando tu embudo y corrígelo con datos reales.',
        },
      ],
    },
    pricing: {
      badge: 'Precios',
      title: 'Planes Para Todos los Tamaños',
      description: 'Elige el plan ideal para el tamaño de tu cartera',
      perMonth: '/mes',
      freeDays: 'días gratis',
      popular: 'Más Popular',
      subscribe: 'Suscribirse',
      upTo: 'Hasta',
      unlimited: 'Ilimitado',
      sites: 'sitios',
      pages: 'páginas por sitio',
      integrations: 'integraciones GSC',
      commonFeatures: [
        'CRM completo',
        'Portal whitelabel',
        'Analytics avanzado',
        'Financiero completo',
        'Soporte prioritario',
      ],
      footer: '*Todos los planes incluyen soporte técnico y actualizaciones gratuitas',
    },
    testimonials: {
      badge: 'Testimonios',
      title: 'Lo Que Dicen Nuestros Clientes',
      description: 'Profesionales de SEO que transformaron sus negocios con Rankito CRM',
      items: [
        {
          name: 'Carlos Silva',
          role: 'CEO, Agencia Digital Pro',
          text: 'Rankito CRM cambió completamente cómo gestionamos nuestra cartera de 30+ sitios. La indexación automática en GSC ahorra 8 horas por semana.',
          category: 'Agencia SEO',
        },
        {
          name: 'Marina Santos',
          role: 'Consultora SEO',
          text: 'Finalmente tengo control financiero total sobre mis proyectos. El ROI automático y el portal whitelabel impresionan a mis clientes.',
          category: 'Consultora',
        },
        {
          name: 'Ricardo Oliveira',
          role: 'Head de Growth',
          text: 'La integración con Google Search Console es simplemente increíble. Ninguna otra plataforma ofrece esto de forma tan profesional.',
          category: 'Startup',
        },
        {
          name: 'Juliana Costa',
          role: 'Fundadora, LeadGen Brasil',
          text: 'El CRM integrado me ayudó a cerrar 40% más contratos. No pierdo más ningún lead y el pipeline es cristalino.',
          category: 'Agencia Lead Gen',
        },
        {
          name: 'Pedro Alves',
          role: 'Especialista Rank & Rent',
          text: 'Gestiono 50 sitios con facilidad. El seguimiento de conversiones y los informes automáticos ahorran días de trabajo manual.',
          category: 'Especialista',
        },
        {
          name: 'Ana Paula',
          role: 'Directora de Marketing',
          text: 'El portal del cliente es perfecto. Mis clientes adoran la transparencia y ya no necesito enviar informes manuales.',
          category: 'Marketing',
        },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Preguntas Frecuentes',
      description: 'Resuelve tus dudas sobre Rankito CRM',
      items: [
        {
          question: '¿Cómo funciona la integración con Google Search Console?',
          answer: 'Conectas tus cuentas de GSC usando Service Account de Google Cloud. El sistema gestiona automáticamente el envío de URLs y sitemaps, respetando los límites diarios de Google (200 URLs/día por cuenta).',
        },
        {
          question: '¿Puedo conectar múltiples cuentas de Google Search Console?',
          answer: '¡Sí! Dependiendo de tu plan, puedes conectar múltiples cuentas GSC. Esto multiplica tu capacidad de indexación diaria. Por ejemplo, con 5 cuentas, puedes indexar hasta 1000 URLs por día.',
        },
        {
          question: '¿El portal whitelabel es realmente personalizable?',
          answer: '¡Sí! Puedes agregar tu logo, definir colores primarios y secundarios, personalizar textos de bienvenida e incluso configurar información de contacto. Cada cliente tiene su propio enlace único y seguro.',
        },
        {
          question: '¿Cómo funciona el seguimiento de conversiones?',
          answer: 'Ofrecemos un plugin de WordPress que instala un píxel de seguimiento en tus páginas. Registra visualizaciones, clics en WhatsApp, teléfonos y formularios. Todo aparece en tiempo real en el panel.',
        },
        {
          question: '¿Puedo probar antes de suscribirme?',
          answer: '¡Sí! Todos los planes de pago incluyen período de prueba gratuito. Free (0 días), Starter (7 días), Professional (14 días), Enterprise (30 días). No necesitas tarjeta de crédito para empezar.',
        },
        {
          question: '¿Tienen soporte en español?',
          answer: '¡Sí! Todo nuestro soporte es en español, incluyendo documentación, tutoriales en video y atención por email/WhatsApp. Respondemos en hasta 24 horas.',
        },
      ],
    },
    cta: {
      title: '¿Listo Para Gestionar Tu Imperio Rank & Rent?',
      description: 'Únete a cientos de profesionales de SEO que ya transformaron sus negocios',
      button: 'Empezar Prueba Gratuita de 7 Días',
      features: [
        'Sin tarjeta de crédito',
        'Cancela cuando quieras',
        'Soporte dedicado',
      ],
    },
    footer: {
      product: {
        title: 'Producto',
        features: 'Funcionalidades',
        pricing: 'Precios',
        start: 'Empezar Ahora',
        gsc: 'Indexación GSC',
      },
      resources: {
        title: 'Recursos',
        docs: 'Documentación',
        tutorials: 'Tutoriales',
        blog: 'Blog',
        faq: 'FAQ',
      },
      company: {
        title: 'Empresa',
        about: 'Sobre Nosotros',
        privacy: 'Política de Privacidad',
        terms: 'Términos de Uso',
        contact: 'Contacto',
      },
      support: {
        title: 'Soporte',
        help: 'Centro de Ayuda',
        status: 'Estado del Sistema',
        email: 'contacto@rankitocrm.com',
        whatsapp: '+34 999 999 999',
      },
      copyright: '© 2024 Rankito CRM. Todos los derechos reservados.',
    },
    whoIsItFor: {
      badge: 'Público Objetivo',
      title: '¿Para Quién es Rankito CRM?',
      subtitle: 'Solución completa para diferentes perfiles de profesionales que gestionan sitios web',
      cta: 'Empezar Gratis',
      profiles: [
        {
          title: 'Agencias de Marketing Digital',
          description: 'Gestionas decenas de sitios para clientes locales, pero Google Analytics es demasiado complejo y tus clientes no entienden informes técnicos. Con Rankito, generas informes visuales automáticos que cuentan una historia clara - tus clientes finalmente entienden el ROI y renuevan contratos.',
          example: 'Gestiono 10-50 sitios de clientes locales y necesito informes que tengan sentido para ellos',
        },
        {
          title: 'Consultores SEO Freelance',
          description: 'Gestionas 5 a 15 sitios solo y pierdes horas creando informes manuales en hojas de cálculo. Con Rankito, automatizas todo el reporting y obtienes un portal de cliente whitelabel - mientras duermes, tus clientes siguen el rendimiento en vivo.',
          example: 'Gestiono 5-15 sitios solo y necesito automatizar los informes',
        },
        {
          title: 'Profesionales de Generación de Leads',
          description: 'Tus sitios generan leads constantemente, pero no tienes visibilidad clara de qué página convierte más, cuál es la hora pico y cuánto realmente gana cada proyecto. Rankito entrega CRM simple + seguimiento preciso + indexación automática - ves exactamente qué funciona y escalas lo que da resultado.',
          example: 'Mis sitios rank & rent generan leads diariamente pero no sé el ROI exacto de cada proyecto',
        },
        {
          title: 'Pequeños E-commerces',
          description: 'Tienes 50 a 500 productos en la tienda, pero no sabes cuáles realmente convierten ni dónde los clientes abandonan el carrito. Con Rankito, ves análisis detallado de productos y embudo visual completo - identificas cuellos de botella y optimizas ventas con datos reales, no conjeturas.',
          example: 'Tengo tienda online pero no sé qué producto vende más y por qué',
        },
        {
          title: 'Gestores de Portafolio',
          description: 'Inviertes en 20+ sitios diferentes y gestionar todo manualmente se volvió caos total - hojas de cálculo rotas, sin saber ROI real de cada proyecto. Rankito consolida todo en un panel único con ROI automático por proyecto - finalmente sabes dónde poner más dinero y dónde recortar.',
          example: 'Invierto en múltiples sitios pero necesito vista consolidada del portafolio',
        },
      ],
    },
    comparison: { badge: '¿Por Qué Rankito?', title: 'La Plataforma Que Hace Lo Que Otras Solo Prometen', subtitle: 'Compara funcionalidades lado a lado', cta: 'Prueba Gratis por 14 Días', footer: '*Google Analytics es gratis, pero pierdes 10h/semana intentando entender', headers: { feature: 'Recurso', googleAnalytics: 'Google Analytics', semrushAhrefs: 'SEMrush/Ahrefs', agencyAnalytics: 'AgencyAnalytics', rankito: 'Rankito CRM' }, rows: [{ feature: 'Complejidad', googleAnalytics: { status: 'no', text: 'Alta curva aprendizaje' }, semrushAhrefs: { status: 'no', text: 'Interfaz técnica' }, agencyAnalytics: { status: 'partial', text: 'Enfocado SEO' }, rankito: { status: 'yes', text: 'Simple y visual' } }, { feature: 'Recorrido Usuario', googleAnalytics: { status: 'no', text: 'Flujos confusos' }, semrushAhrefs: { status: 'no', text: 'No tiene' }, agencyAnalytics: { status: 'no', text: 'No tiene' }, rankito: { status: 'yes', text: 'Página por página' } }, { feature: 'E-commerce', googleAnalytics: { status: 'partial', text: 'Setup complejo' }, semrushAhrefs: { status: 'no', text: 'Solo keywords' }, agencyAnalytics: { status: 'no', text: 'No tiene' }, rankito: { status: 'yes', text: 'Automático' } }, { feature: 'Indexación GSC', googleAnalytics: { status: 'no', text: 'No tiene' }, semrushAhrefs: { status: 'partial', text: 'Solo monitorea' }, agencyAnalytics: { status: 'no', text: 'No tiene' }, rankito: { status: 'yes', text: 'Automación completa' } }, { feature: 'Portal Cliente', googleAnalytics: { status: 'no', text: 'No tiene' }, semrushAhrefs: { status: 'no', text: 'No tiene' }, agencyAnalytics: { status: 'yes', text: 'Tiene' }, rankito: { status: 'yes', text: 'Whitelabel' } }, { feature: 'CRM Integrado', googleAnalytics: { status: 'no', text: 'No tiene' }, semrushAhrefs: { status: 'no', text: 'No tiene' }, agencyAnalytics: { status: 'no', text: 'No tiene' }, rankito: { status: 'yes', text: 'Pipeline + leads' } }, { feature: 'Informes', googleAnalytics: { status: 'no', text: 'Tú creas' }, semrushAhrefs: { status: 'partial', text: 'Exporta datos' }, agencyAnalytics: { status: 'yes', text: 'Tiene' }, rankito: { status: 'yes', text: 'Automáticos' } }, { feature: 'Precio/mes', googleAnalytics: { status: 'partial', text: 'Gratis*' }, semrushAhrefs: { status: 'no', text: '€500-2000' }, agencyAnalytics: { status: 'no', text: '€400-800' }, rankito: { status: 'yes', text: '€97-797' } }] },
    pillars: { badge: 'Nuestra Filosofía', title: 'Lo Que Nos Hace Diferentes', subtitle: 'Principios que guían cada funcionalidad que creamos', items: [{ title: 'Claridad, No Complejidad', description: 'Google Analytics muestra 47 métricas. Necesitas 5 que importan. Informes que tu cliente ENTIENDE, no tablas que nadie lee.' }, { title: 'Acción, No Solo Datos', description: 'Otras herramientas muestran datos. Rankito muestra QUÉ HACER. No es solo ver números, es indexar, seguir el recorrido, cerrar leads.' }, { title: 'Automatización Total', description: 'Deja de gastar 6 horas creando informes. Genera en 2 clics. Indexación que funciona sola. CRM que captura leads automáticamente.' }, { title: 'Todo en Un Solo Lugar', description: 'Analytics + CRM + Financiero + Portal Cliente + Indexación GSC. Una mensualidad, cero integraciones rotas.' }] },
    roiCalculator: {
      badge: 'Calculadora de Ahorro',
      title: '¿Cuánto Estás Perdiendo Sin Rankito?',
      subtitle: 'Calcula tu ahorro mensual en tiempo y dinero',
      cta: 'Empieza a Ahorrar Ahora - 14 Días Gratis',
      ctaSubtext: 'Sin tarjeta de crédito. Cancela cuando quieras.',
      inputs: {
        sites: { label: '¿Cuántos sitios gestionas?', description: 'Número total de sitios/proyectos bajo tu gestión' },
        hours: { label: '¿Cuántas horas/semana gastas en tareas manuales?', description: 'Informes, indexación, análisis de datos, etc.' },
        rate: { label: '¿Cuánto vale tu hora? (€)', description: 'Valor promedio por hora de tu trabajo' },
      },
      results: {
        title: 'Tu Retorno Invirtiendo en Rankito',
        monthlySavings: 'Ahorro Mensual',
        timeSaved: 'Horas Ahorradas',
        month: 'mes',
        week: 'semana',
        yearlyROI: 'ROI en 12 Meses',
        roiPercentage: 'Retorno de Inversión',
        netProfit: 'Beneficio Neto Mensual',
      },
      calculationLogic: {
        title: '¿Cómo Calculamos?',
        steps: {
          timePerSite: { title: 'Tiempo por sitio' },
          hoursSaved: { title: 'Horas ahorradas', description: 'de trabajo manual eliminado' },
          monthlySavings: { title: 'Ahorro mensual bruto', weeks: 'semanas' },
          rankitoCost: { title: 'Costo Rankito', plan: 'Plan Professional' },
          netProfit: { title: 'Beneficio neto mensual' },
        },
        footer: 'En 12 meses ahorras {total} ({percentage}% ROI)',
      },
    },
  },
  'en-US': {
    nav: {
      features: 'Features',
      gsc: 'GSC Indexing',
      pricing: 'Pricing',
      faq: 'FAQ',
      login: 'Login',
      startFree: 'Start Free',
    },
    hero: {
      badge: 'Rank & Rent CRM',
      title: 'Manage Your Rank & Rent Empire with Intelligence',
      painPoint: 'Stop losing money with uncontrolled sites, invisible conversions and manual indexing consuming your time.',
      description: 'The only complete platform for SEO professionals managing lead generation site portfolios. Centralize management, finance, CRM and automatic indexing in one place.',
      ctaPrimary: 'Start Free Now',
      ctaSecondary: 'View Demo',
      socialProof: {
        sites: '200+ managed sites',
        revenue: '$150K+ in revenue',
        secure: '100% secure data',
      },
    },
    problems: {
      title: 'Recognize These Problems?',
      items: [
        'Sites stuck without knowing which are converting',
        'Pages created but not indexed by Google',
        'Hours lost in disorganized spreadsheets',
        'Client asks for report and you have no data',
        'Leads call and you write on paper',
        'Without knowing the real ROI of each project',
      ],
      conclusion: '👉 Rankito CRM solves ALL these problems in a single platform.',
    },
    features: {
      badge: 'Features',
      title: 'Everything You Need in One Platform',
      subtitle: 'Manage your portfolio with professional tools',
      items: [
        {
          title: 'Smart Dashboard',
          description: "Don't know which sites are converting and losing money? Track performance, revenue, costs and ROI of all your sites in real time. Metrics that matter, no noise.",
          benefits: [
            'Overview of all sites',
            'Revenue and costs in real time',
            'Automatic ROI per project',
            'Performance alerts',
          ],
          badge: 'Essential',
        },
        {
          title: 'Complete CRM',
          description: "Leads call, you write on paper and forget to return? Capture leads automatically, manage deals, automate follow-ups and never miss a business opportunity again.",
          benefits: [
            'Visual sales pipeline',
            'Follow-up automation',
            'Complete interaction history',
            'WhatsApp integration',
          ],
        },
        {
          title: 'Automatic GSC Indexing',
          description: "Tired of indexing 5 pages at a time manually in Search Console? Connect your Google account and index hundreds of pages automatically. Submit sitemaps, schedule indexing and monitor status in real time.",
          benefits: [
            'Mass indexing (200+ URLs/day)',
            'Automatic scheduling',
            'Status monitoring',
            'Multiple GSC accounts',
          ],
          badge: 'Exclusive',
        },
        {
          title: 'E-commerce Tracking',
          description: 'Track sales, products, and revenue directly on your sites with complete e-commerce tracking.',
          benefits: [
            'Pioneer platform with complete e-commerce tracking',
            'Automatic product view tracking',
            'Capture add-to-cart and checkout events',
            'Revenue attribution per product and page',
            'Complete funnel: view → cart → purchase',
            'Integration with Shopify, WooCommerce, and HTML sites'
          ],
          badge: '🌍 World First',
        },
        {
          title: 'Complete Financial',
          description: "Disorganized spreadsheets and not knowing if you're profiting or losing? Record revenue, costs, payments and calculate ROI automatically. Know exactly how much each site is generating.",
          benefits: [
            'Revenue and expense control',
            'Automatic ROI per site',
            'Payment history',
            'Financial projections',
          ],
        },
        {
          title: 'Whitelabel Portal',
          description: "Client asked for report and you have nothing to show? Generate customized portals with your logo and colors. Your clients track performance without accessing your dashboard.",
          benefits: [
            'Complete customization (logo, colors)',
            'Secure access via unique link',
            'Real-time metrics',
            'Automatic reports',
          ],
        },
        {
          title: 'Advanced Analytics',
          description: "Don't know how many leads each page generated today? Know how many leads each page generates, where they come from, when they happen. Tracking pixel + WordPress integration.",
          benefits: [
            'Conversion tracking per page',
            'Detailed traffic source',
            'Peak hours',
            'WordPress plugin included',
          ],
        },
        {
          title: 'User Journey',
          description: "Don't know where your visitors navigate or where they drop off? Track every step of the customer journey - from entry to exit - with sniper precision. See complete sequences, time spent per page, and identify funnel bottlenecks.",
          benefits: [
            'Complete page-by-page navigation sequences',
            'Real-time spent on each journey step',
            'Bounce session and problematic page identification',
            'Behavioral analysis of navigation patterns',
            'Smart filters by session volume',
          ],
        },
      ],
    },
    gsc: {
      badge: 'Stop Wasting Time',
      title: 'Stop Indexing 5 Pages at a Time Manually',
      painPoint: "You have 500 pages created but Google only indexed 50? You're losing money every day while your pages remain invisible.",
      description: 'Our automatic indexing connects to Google Search Console and indexes hundreds of pages per day. No manual effort, no missed opportunities.',
      ctaButton: 'Start Indexing Now',
      features: [
        {
          title: 'Mass Indexing',
          description: 'Submit up to 200 URLs per day automatically to Google Search Console. Multiply this by how many accounts you connect.',
        },
        {
          title: 'Smart Scheduling',
          description: 'Configure automatic schedules for sitemap submission. The system manages everything without you having to remember.',
        },
        {
          title: 'Real-Time Monitoring',
          description: 'Track the status of each URL: pending, indexed, error. Know exactly what\'s happening with your pages.',
        },
      ],
    },
    ecommerce: {
      badge: '🎯 Total Monitoring',
      title: 'Track Every Click and Index All Pages Automatically',
      painPoint: 'Does your site have invisible pages on Google? Don\'t know how many clicks each product gets? Losing sales because products don\'t appear in searches?',
      description: 'Monitor ALL clicks, views, and actions on your site pages. Automatically index on Google and Bing for maximum visibility. Have complete clarity of the conversion funnel in real-time.',
      ctaButton: 'Start Complete Monitoring',
      highlight: '🏆 PERFECT CLICK MONITORING + AUTOMATIC INDEXING = ZERO INVISIBLE PAGES + CLEAR FUNNEL VISION',
      features: [
        {
          title: 'All Clicks Monitoring',
          description: 'Track every click, product view, add to cart, and conversion. Know exactly how visitors interact with your pages.',
        },
        {
          title: 'Automatic Google + Bing Indexing',
          description: 'All pages are automatically sent for indexing. Zero invisible pages in searches. Maximum organic coverage without manual work.',
        },
        {
          title: 'Complete Conversion Funnel',
          description: 'Visualize the entire journey: View → Interest → Action → Conversion. Identify exactly where visitors drop off and optimize.',
        },
        {
          title: 'Total Real-Time Clarity',
          description: 'Dashboard shows most clicked pages, conversion rate per page, peak hours, traffic source, and detailed revenue.',
        },
        {
          title: 'Works on Any Platform',
          description: 'Compatible with Shopify, WooCommerce, WordPress, and any HTML. Universal pixel that tracks everything without complex configuration.',
        },
      ],
    },
    userJourney: {
      badge: '🎯 Smart Tracking',
      title: 'See Your Visitors\' Complete Journey with Sniper Precision',
      painPoint: 'Do you know EXACTLY which pages your visitors access, how long they stay, and where they exit? Or are you in the dark?',
      description: 'Advanced tracking system that captures every step of the user journey - from first page to conversion or exit - with pinpoint accuracy.',
      ctaButton: 'See Journey in Action',
      highlight: 'Discover WHERE your visitors are dropping off and OPTIMIZE your funnel with real data',
      features: [
        {
          title: 'Complete Sequences',
          description: 'See the exact path each visitor takes: Home (2m34s) → Services (45s) → Contact (1m12s). Not just "X pageviews", it\'s the complete journey.',
        },
        {
          title: 'Real-Time per Page',
          description: 'Every second counted. Know exactly how much time visitors spend at each funnel stage. Pinpoint accuracy.',
        },
        {
          title: 'Behavioral Analysis',
          description: 'Identify the most common navigation patterns. Discover the sequences that lead to conversion and those that lead to drop-off.',
        },
        {
          title: 'Bounce Sessions',
          description: 'Visualize pages with high exit rates. Understand where 80% of visitors are abandoning your funnel and fix it with real data.',
        },
      ],
    },
    pricing: {
      badge: 'Pricing',
      title: 'Plans For All Sizes',
      description: 'Choose the ideal plan for your portfolio size',
      perMonth: '/month',
      freeDays: 'free days',
      popular: 'Most Popular',
      subscribe: 'Subscribe',
      upTo: 'Up to',
      unlimited: 'Unlimited',
      sites: 'sites',
      pages: 'pages per site',
      integrations: 'GSC integrations',
      commonFeatures: [
        'Complete CRM',
        'Whitelabel portal',
        'Advanced analytics',
        'Complete financial',
        'Priority support',
      ],
      footer: '*All plans include technical support and free updates',
    },
    testimonials: {
      badge: 'Testimonials',
      title: 'What Our Clients Say',
      description: 'SEO professionals who transformed their businesses with Rankito CRM',
      items: [
        {
          name: 'Carlos Smith',
          role: 'CEO, Digital Pro Agency',
          text: 'Rankito CRM completely changed how we manage our 30+ site portfolio. Automatic GSC indexing saves 8 hours per week.',
          category: 'SEO Agency',
        },
        {
          name: 'Marina Santos',
          role: 'SEO Consultant',
          text: 'I finally have total financial control over my projects. The automatic ROI and whitelabel portal impress my clients.',
          category: 'Consultant',
        },
        {
          name: 'Ricardo Oliveira',
          role: 'Head of Growth',
          text: 'The Google Search Console integration is simply amazing. No other platform offers this so professionally.',
          category: 'Startup',
        },
        {
          name: 'Juliana Costa',
          role: 'Founder, LeadGen Brasil',
          text: 'The integrated CRM helped me close 40% more contracts. I no longer miss any lead and the pipeline is crystal clear.',
          category: 'Lead Gen Agency',
        },
        {
          name: 'Pedro Alves',
          role: 'Rank & Rent Specialist',
          text: 'I manage 50 sites with ease. Conversion tracking and automatic reports save days of manual work.',
          category: 'Specialist',
        },
        {
          name: 'Ana Paula',
          role: 'Marketing Director',
          text: 'The client portal is perfect. My clients love the transparency and I no longer need to send manual reports.',
          category: 'Marketing',
        },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Frequently Asked Questions',
      description: 'Clear your doubts about Rankito CRM',
      items: [
        {
          question: 'How does the Google Search Console integration work?',
          answer: 'You connect your GSC accounts using Google Cloud Service Account. The system automatically manages URL and sitemap submissions, respecting Google daily limits (200 URLs/day per account).',
        },
        {
          question: 'Can I connect multiple Google Search Console accounts?',
          answer: 'Yes! Depending on your plan, you can connect multiple GSC accounts. This multiplies your daily indexing capacity. For example, with 5 accounts, you can index up to 1000 URLs per day.',
        },
        {
          question: 'Is the whitelabel portal really customizable?',
          answer: 'Yes! You can add your logo, set primary and secondary colors, customize welcome texts and even configure contact information. Each client has their own unique and secure link.',
        },
        {
          question: 'How does conversion tracking work?',
          answer: 'We offer a WordPress plugin that installs a tracking pixel on your pages. It records views, clicks on WhatsApp, phones and forms. Everything appears in real time on the dashboard.',
        },
        {
          question: 'Can I test before subscribing?',
          answer: 'Yes! All paid plans include free trial period. Free (0 days), Starter (7 days), Professional (14 days), Enterprise (30 days). No credit card needed to start.',
        },
        {
          question: 'Do you have support in English?',
          answer: 'Yes! All our support is in English, including documentation, video tutorials and service by email/WhatsApp. We respond within 24 hours.',
        },
      ],
    },
    cta: {
      title: 'Ready To Manage Your Rank & Rent Empire?',
      description: 'Join hundreds of SEO professionals who have already transformed their businesses',
      button: 'Start 7-Day Free Trial',
      features: [
        'No credit card',
        'Cancel anytime',
        'Dedicated support',
      ],
    },
    footer: {
      product: {
        title: 'Product',
        features: 'Features',
        pricing: 'Pricing',
        start: 'Start Now',
        gsc: 'GSC Indexing',
      },
      resources: {
        title: 'Resources',
        docs: 'Documentation',
        tutorials: 'Tutorials',
        blog: 'Blog',
        faq: 'FAQ',
      },
      company: {
        title: 'Company',
        about: 'About Us',
        privacy: 'Privacy Policy',
        terms: 'Terms of Use',
        contact: 'Contact',
      },
      support: {
        title: 'Support',
        help: 'Help Center',
        status: 'System Status',
        email: 'contact@rankitocrm.com',
        whatsapp: '+1 999 999 9999',
      },
      copyright: '© 2024 Rankito CRM. All rights reserved.',
    },
    whoIsItFor: {
      badge: 'Target Audience',
      title: 'Who is Rankito CRM for?',
      subtitle: 'Complete solution for different profiles of professionals managing websites',
      cta: 'Start Free',
      profiles: [
        {
          title: 'Digital Marketing Agencies',
          description: 'You manage dozens of sites for local clients, but Google Analytics is too complex and your clients don\'t understand technical reports. With Rankito, you generate automatic visual reports that tell a clear story - your clients finally understand ROI and renew contracts.',
          example: 'I manage 10-50 local client sites and need reports that make sense to them',
        },
        {
          title: 'Freelance SEO Consultants',
          description: 'You manage 5 to 15 sites alone and waste hours creating manual reports in spreadsheets. With Rankito, you automate all reporting and get a whitelabel client portal - while you sleep, your clients track performance live.',
          example: 'I manage 5-15 sites alone and need to automate reporting',
        },
        {
          title: 'Lead Generation Professionals',
          description: 'Your sites generate leads constantly, but you lack clear visibility on which page converts more, peak time and how much each project really profits. Rankito delivers simple CRM + accurate tracking + automatic indexing - you see exactly what works and scale what delivers results.',
          example: 'My rank & rent sites generate daily leads but I don\'t know exact ROI per project',
        },
        {
          title: 'Small E-commerces',
          description: 'You have 50 to 500 products in your store, but don\'t know which really convert or where customers abandon cart. With Rankito, you see detailed product analytics and complete visual funnel - identify bottlenecks and optimize sales with real data, not guesswork.',
          example: 'I have an online store but don\'t know which product sells more and why',
        },
        {
          title: 'Portfolio Managers',
          description: 'You invest in 20+ different sites and managing everything manually became total chaos - broken spreadsheets, without knowing real ROI per project. Rankito consolidates everything in a single dashboard with automatic ROI per project - you finally know where to put more money and where to cut.',
          example: 'I invest in multiple sites but need consolidated portfolio view',
        },
      ],
    },
    comparison: { badge: 'Why Rankito?', title: 'The Platform That Delivers What Others Only Promise', subtitle: 'Compare features side by side', cta: 'Try Free for 14 Days', footer: '*Google Analytics is free, but you lose 10h/week trying to understand', headers: { feature: 'Feature', googleAnalytics: 'Google Analytics', semrushAhrefs: 'SEMrush/Ahrefs', agencyAnalytics: 'AgencyAnalytics', rankito: 'Rankito CRM' }, rows: [{ feature: 'Complexity', googleAnalytics: { status: 'no', text: 'High learning curve' }, semrushAhrefs: { status: 'no', text: 'Technical interface' }, agencyAnalytics: { status: 'partial', text: 'SEO focused' }, rankito: { status: 'yes', text: 'Simple and visual' } }, { feature: 'User Journey', googleAnalytics: { status: 'no', text: 'Confusing flows' }, semrushAhrefs: { status: 'no', text: 'No' }, agencyAnalytics: { status: 'no', text: 'No' }, rankito: { status: 'yes', text: 'Page by page' } }, { feature: 'E-commerce', googleAnalytics: { status: 'partial', text: 'Complex setup' }, semrushAhrefs: { status: 'no', text: 'Only keywords' }, agencyAnalytics: { status: 'no', text: 'No' }, rankito: { status: 'yes', text: 'Automatic' } }, { feature: 'GSC Indexing', googleAnalytics: { status: 'no', text: 'No' }, semrushAhrefs: { status: 'partial', text: 'Only monitors' }, agencyAnalytics: { status: 'no', text: 'No' }, rankito: { status: 'yes', text: 'Full automation' } }, { feature: 'Client Portal', googleAnalytics: { status: 'no', text: 'No' }, semrushAhrefs: { status: 'no', text: 'No' }, agencyAnalytics: { status: 'yes', text: 'Yes' }, rankito: { status: 'yes', text: 'Whitelabel' } }, { feature: 'Integrated CRM', googleAnalytics: { status: 'no', text: 'No' }, semrushAhrefs: { status: 'no', text: 'No' }, agencyAnalytics: { status: 'no', text: 'No' }, rankito: { status: 'yes', text: 'Pipeline + leads' } }, { feature: 'Reports', googleAnalytics: { status: 'no', text: 'You create' }, semrushAhrefs: { status: 'partial', text: 'Exports data' }, agencyAnalytics: { status: 'yes', text: 'Yes' }, rankito: { status: 'yes', text: 'Automatic' } }, { feature: 'Price/month', googleAnalytics: { status: 'partial', text: 'Free*' }, semrushAhrefs: { status: 'no', text: '$500-2000' }, agencyAnalytics: { status: 'no', text: '$400-800' }, rankito: { status: 'yes', text: '$97-797' } }] },
    pillars: { badge: 'Our Philosophy', title: 'What Makes Us Different', subtitle: 'Principles guiding every feature we create', items: [{ title: 'Clarity, Not Complexity', description: 'Google Analytics shows 47 metrics. You need 5 that matter. Reports your client UNDERSTANDS, not tables nobody reads.' }, { title: 'Action, Not Just Data', description: 'Other tools show data. Rankito shows WHAT TO DO. It\'s not just seeing numbers, it\'s indexing, tracking journey, closing leads.' }, { title: 'Total Automation', description: 'Stop spending 6 hours creating reports. Generate in 2 clicks. Indexing that runs itself. CRM that captures leads automatically.' }, { title: 'All in One Place', description: 'Analytics + CRM + Financial + Client Portal + GSC Indexing. One subscription, zero broken integrations.' }] },
    roiCalculator: {
      badge: 'Savings Calculator',
      title: 'How Much Are You Losing Without Rankito?',
      subtitle: 'Calculate your monthly savings in time and money',
      cta: 'Start Saving Now - 14 Days Free',
      ctaSubtext: 'No credit card. Cancel anytime.',
      inputs: {
        sites: { label: 'How many sites do you manage?', description: 'Total number of sites/projects under management' },
        hours: { label: 'How many hours/week on manual tasks?', description: 'Reports, indexing, data analysis, etc.' },
        rate: { label: 'What\'s your hourly rate? ($)', description: 'Average value per hour of your work' },
      },
      results: {
        title: 'Your Savings with Rankito:',
        monthlySavings: 'Gross Monthly Savings',
        timeSaved: 'Time Saved',
        month: 'month',
        week: 'week',
        yearlyROI: '12-Month ROI',
        roiPercentage: 'Return on Investment',
        netProfit: 'Net Monthly Profit',
      },
      calculationLogic: {
        title: 'How Do We Calculate?',
        steps: {
          timePerSite: { title: 'Time per site' },
          hoursSaved: { title: 'Hours saved', description: 'of manual work eliminated' },
          monthlySavings: { title: 'Gross monthly savings', weeks: 'weeks' },
          rankitoCost: { title: 'Rankito Cost', plan: 'Professional Plan' },
          netProfit: { title: 'Net monthly profit' },
        },
        footer: 'In 12 months you save {total} ({percentage}% ROI)',
      },
    },
  },
  'fr-FR': {
    nav: {
      features: 'Fonctionnalités',
      gsc: 'Indexation GSC',
      pricing: 'Tarifs',
      faq: 'FAQ',
      login: 'Connexion',
      startFree: 'Commencer Gratuitement',
    },
    hero: {
      badge: 'Rank & Rent CRM',
      title: 'Gérez Votre Empire de Rank & Rent avec Intelligence',
      painPoint: 'Arrêtez de perdre de l\'argent avec des sites incontrôlés, des conversions invisibles et une indexation manuelle qui consomme votre temps.',
      description: 'La seule plateforme complète pour les professionnels SEO gérant des portefeuilles de sites de génération de leads. Centralisez gestion, finance, CRM et indexation automatique en un seul endroit.',
      ctaPrimary: 'Commencer Gratuitement',
      ctaSecondary: 'Voir Démo',
      socialProof: {
        sites: '200+ sites gérés',
        revenue: '€120K+ de revenus',
        secure: 'Données 100% sécurisées',
      },
    },
    problems: {
      title: 'Reconnaissez-Vous Ces Problèmes?',
      items: [
        'Sites bloqués sans savoir lesquels convertissent',
        'Pages créées mais non indexées par Google',
        'Heures perdues dans des feuilles de calcul désorganisées',
        'Client demande un rapport et vous n\'avez pas de données',
        'Leads appellent et vous notez sur papier',
        'Sans connaître le ROI réel de chaque projet',
      ],
      conclusion: '👉 Rankito CRM résout TOUS ces problèmes sur une seule plateforme.',
    },
    features: {
      badge: 'Fonctionnalités',
      title: 'Tout Ce Dont Vous Avez Besoin sur Une Plateforme',
      subtitle: 'Gérez votre portefeuille avec des outils professionnels',
      items: [
        {
          title: 'Tableau de Bord Intelligent',
          description: 'Vous ne savez pas quels sites convertissent et perdent de l\'argent? Suivez les performances, revenus, coûts et ROI de tous vos sites en temps réel. Métriques importantes, sans bruit.',
          benefits: [
            'Vue d\'ensemble de tous les sites',
            'Revenus et coûts en temps réel',
            'ROI automatique par projet',
            'Alertes de performance',
          ],
          badge: 'Essentiel',
        },
        {
          title: 'CRM Complet',
          description: 'Les leads appellent, vous notez sur papier et oubliez de rappeler? Capturez automatiquement les leads, gérez les deals, automatisez les suivis et ne manquez plus jamais une opportunité commerciale.',
          benefits: [
            'Pipeline visuel des ventes',
            'Automatisation des suivis',
            'Historique complet des interactions',
            'Intégration WhatsApp',
          ],
        },
        {
          title: 'Indexation Automatique GSC',
          description: 'Fatigué d\'indexer 5 pages à la fois manuellement dans Search Console? Connectez votre compte Google et indexez des centaines de pages automatiquement. Soumettez des sitemaps, programmez l\'indexation et surveillez l\'état en temps réel.',
          benefits: [
            'Indexation de masse (200+ URLs/jour)',
            'Programmation automatique',
            'Surveillance de l\'état',
            'Plusieurs comptes GSC',
          ],
          badge: 'Exclusif',
        },
        {
          title: 'E-commerce Tracking',
          description: 'Suivez les ventes, produits et revenus directement sur vos sites avec tracking e-commerce complet.',
          benefits: [
            'Plateforme pionnière avec tracking e-commerce complet',
            'Suivi automatique des vues de produits',
            'Capture des ajouts au panier et checkouts',
            'Attribution des revenus par produit et page',
            'Entonnoir complet : vue → panier → achat',
            'Intégration avec Shopify, WooCommerce et sites HTML'
          ],
          badge: '🌍 Première Mondiale',
        },
        {
          title: 'Finance Complète',
          description: 'Feuilles de calcul désorganisées et sans savoir si vous gagnez ou perdez? Enregistrez revenus, coûts, paiements et calculez le ROI automatiquement. Sachez exactement combien génère chaque site.',
          benefits: [
            'Contrôle des revenus et dépenses',
            'ROI automatique par site',
            'Historique des paiements',
            'Projections financières',
          ],
        },
        {
          title: 'Portail Whitelabel',
          description: 'Client a demandé un rapport et vous n\'avez rien à montrer? Générez des portails personnalisés avec votre logo et couleurs. Vos clients suivent les performances sans accéder à votre tableau de bord.',
          benefits: [
            'Personnalisation complète (logo, couleurs)',
            'Accès sécurisé par lien unique',
            'Métriques en temps réel',
            'Rapports automatiques',
          ],
        },
        {
          title: 'Analytics Avancé',
          description: 'Vous ne savez pas combien de leads chaque page a générés aujourd\'hui? Découvrez combien de leads génère chaque page, d\'où ils viennent, quand ils se produisent. Pixel de suivi + intégration WordPress.',
          benefits: [
            'Suivi des conversions par page',
            'Source de trafic détaillée',
            'Heures de pointe',
            'Plugin WordPress inclus',
          ],
        },
        {
          title: 'Parcours Utilisateur',
          description: 'Vous ne savez pas où vos visiteurs naviguent ni où ils abandonnent? Suivez chaque étape du parcours client - de l\'entrée à la sortie - avec une précision de tireur d\'élite. Voyez les séquences complètes, le temps passé par page et identifiez les goulets d\'étranglement dans l\'entonnoir.',
          benefits: [
            'Séquences complètes de navigation page par page',
            'Temps réel passé à chaque étape du parcours',
            'Identification des bounce sessions et pages problématiques',
            'Analyse comportementale des modèles de navigation',
            'Filtres intelligents par volume de sessions',
          ],
        },
      ],
    },
    gsc: {
      badge: 'Arrêtez de Perdre du Temps',
      title: 'Arrêtez d\'Indexer 5 Pages à la Fois Manuellement',
      painPoint: 'Vous avez 500 pages créées mais Google n\'en a indexé que 50? Vous perdez de l\'argent tous les jours pendant que vos pages restent invisibles.',
      description: 'Notre indexation automatique se connecte à Google Search Console et indexe des centaines de pages par jour. Sans effort manuel, sans opportunités manquées.',
      ctaButton: 'Commencer à Indexer Maintenant',
      features: [
        {
          title: 'Indexation de Masse',
          description: 'Soumettez jusqu\'à 200 URLs par jour automatiquement à Google Search Console. Multipliez cela par le nombre de comptes que vous connectez.',
        },
        {
          title: 'Programmation Intelligente',
          description: 'Configurez des horaires automatiques pour la soumission de sitemaps. Le système gère tout sans que vous ayez à vous en souvenir.',
        },
        {
          title: 'Surveillance en Temps Réel',
          description: 'Suivez l\'état de chaque URL: en attente, indexée, erreur. Sachez exactement ce qui se passe avec vos pages.',
        },
      ],
    },
    ecommerce: {
      badge: '🎯 Suivi Total',
      title: 'Suivez Chaque Clic et Indexez Toutes les Pages Automatiquement',
      painPoint: 'Votre site a des pages invisibles sur Google? Vous ne savez pas combien de clics chaque produit reçoit? Vous perdez des ventes parce que les produits n\'apparaissent pas dans les recherches?',
      description: 'Surveillez TOUS les clics, vues et actions sur les pages de vos sites. Indexez automatiquement sur Google et Bing pour une visibilité maximale. Ayez une clarté totale de l\'entonnoir de conversion en temps réel.',
      ctaButton: 'Commencer le Suivi Complet',
      highlight: '🏆 SUIVI PARFAIT DES CLICS + INDEXATION AUTOMATIQUE = ZÉRO PAGE INVISIBLE + VISION CLAIRE DE L\'ENTONNOIR',
      features: [
        {
          title: 'Suivi de Tous les Clics',
          description: 'Suivez chaque clic, vue de produit, ajout au panier et conversion. Sachez exactement comment les visiteurs interagissent avec vos pages.',
        },
        {
          title: 'Indexation Automatique Google + Bing',
          description: 'Toutes les pages sont automatiquement envoyées pour indexation. Zéro page invisible dans les recherches. Couverture organique maximale sans travail manuel.',
        },
        {
          title: 'Entonnoir Complet de Conversion',
          description: 'Visualisez tout le parcours: Vue → Intérêt → Action → Conversion. Identifiez exactement où les visiteurs abandonnent et optimisez.',
        },
        {
          title: 'Clarté Totale en Temps Réel',
          description: 'Tableau de bord affiche les pages les plus cliquées, taux de conversion par page, heures de pointe, source de trafic et revenus détaillés.',
        },
        {
          title: 'Fonctionne sur Toute Plateforme',
          description: 'Compatible avec Shopify, WooCommerce, WordPress et tout HTML. Pixel universel qui suit tout sans configuration complexe.',
        },
      ],
    },
    userJourney: {
      badge: '🎯 Suivi Intelligent',
      title: 'Voyez le Parcours Complet de Vos Visiteurs avec Précision de Sniper',
      painPoint: 'Savez-vous EXACTEMENT quelles pages vos visiteurs consultent, combien de temps ils restent et où ils sortent? Ou êtes-vous dans le noir?',
      description: 'Système de suivi avancé qui capture chaque étape du parcours utilisateur - de la première page jusqu\'à la conversion ou la sortie - avec une précision millimétrique.',
      ctaButton: 'Voir le Parcours en Action',
      highlight: 'Découvrez OÙ vos visiteurs abandonnent et OPTIMISEZ votre entonnoir avec des données réelles',
      features: [
        {
          title: 'Séquences Complètes',
          description: 'Voyez le chemin exact de chaque visiteur: Accueil (2m34s) → Services (45s) → Contact (1m12s). Pas seulement "X pages vues", c\'est le parcours complet.',
        },
        {
          title: 'Temps Réel par Page',
          description: 'Chaque seconde comptabilisée. Sachez exactement combien de temps les visiteurs passent à chaque étape de l\'entonnoir. Précision millimétrique.',
        },
        {
          title: 'Analyse Comportementale',
          description: 'Identifiez les modèles de navigation les plus courants. Découvrez les séquences qui mènent à la conversion et celles qui mènent à l\'abandon.',
        },
        {
          title: 'Sessions de Rebond',
          description: 'Visualisez les pages avec un taux de sortie élevé. Comprenez où 80% des visiteurs abandonnent votre entonnoir et corrigez avec des données réelles.',
        },
      ],
    },
    pricing: {
      badge: 'Tarifs',
      title: 'Plans Pour Toutes les Tailles',
      description: 'Choisissez le plan idéal pour la taille de votre portefeuille',
      perMonth: '/mois',
      freeDays: 'jours gratuits',
      popular: 'Plus Populaire',
      subscribe: 'S\'abonner',
      upTo: 'Jusqu\'à',
      unlimited: 'Illimité',
      sites: 'sites',
      pages: 'pages par site',
      integrations: 'intégrations GSC',
      commonFeatures: [
        'CRM complet',
        'Portail whitelabel',
        'Analytics avancé',
        'Finance complète',
        'Support prioritaire',
      ],
      footer: '*Tous les plans incluent le support technique et les mises à jour gratuites',
    },
    testimonials: {
      badge: 'Témoignages',
      title: 'Ce Que Disent Nos Clients',
      description: 'Professionnels SEO qui ont transformé leurs entreprises avec Rankito CRM',
      items: [
        {
          name: 'Carlos Silva',
          role: 'PDG, Agence Digital Pro',
          text: 'Rankito CRM a complètement changé la façon dont nous gérons notre portefeuille de 30+ sites. L\'indexation automatique GSC économise 8 heures par semaine.',
          category: 'Agence SEO',
        },
        {
          name: 'Marina Santos',
          role: 'Consultante SEO',
          text: 'J\'ai enfin un contrôle financier total sur mes projets. Le ROI automatique et le portail whitelabel impressionnent mes clients.',
          category: 'Consultante',
        },
        {
          name: 'Ricardo Oliveira',
          role: 'Responsable Growth',
          text: 'L\'intégration avec Google Search Console est tout simplement incroyable. Aucune autre plateforme n\'offre cela de manière aussi professionnelle.',
          category: 'Startup',
        },
        {
          name: 'Juliana Costa',
          role: 'Fondatrice, LeadGen Brasil',
          text: 'Le CRM intégré m\'a aidée à conclure 40% de contrats en plus. Je ne perds plus aucun lead et le pipeline est limpide.',
          category: 'Agence Lead Gen',
        },
        {
          name: 'Pedro Alves',
          role: 'Spécialiste Rank & Rent',
          text: 'Je gère 50 sites avec facilité. Le suivi des conversions et les rapports automatiques économisent des jours de travail manuel.',
          category: 'Spécialiste',
        },
        {
          name: 'Ana Paula',
          role: 'Directrice Marketing',
          text: 'Le portail client est parfait. Mes clients adorent la transparence et je n\'ai plus besoin d\'envoyer de rapports manuels.',
          category: 'Marketing',
        },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Questions Fréquentes',
      description: 'Clarifiez vos doutes sur Rankito CRM',
      items: [
        {
          question: 'Comment fonctionne l\'intégration avec Google Search Console?',
          answer: 'Vous connectez vos comptes GSC en utilisant le Service Account de Google Cloud. Le système gère automatiquement la soumission d\'URLs et de sitemaps, en respectant les limites quotidiennes de Google (200 URLs/jour par compte).',
        },
        {
          question: 'Puis-je connecter plusieurs comptes Google Search Console?',
          answer: 'Oui! Selon votre plan, vous pouvez connecter plusieurs comptes GSC. Cela multiplie votre capacité d\'indexation quotidienne. Par exemple, avec 5 comptes, vous pouvez indexer jusqu\'à 1000 URLs par jour.',
        },
        {
          question: 'Le portail whitelabel est-il vraiment personnalisable?',
          answer: 'Oui! Vous pouvez ajouter votre logo, définir des couleurs primaires et secondaires, personnaliser les textes de bienvenue et même configurer les informations de contact. Chaque client a son propre lien unique et sécurisé.',
        },
        {
          question: 'Comment fonctionne le suivi des conversions?',
          answer: 'Nous proposons un plugin WordPress qui installe un pixel de suivi sur vos pages. Il enregistre les vues, les clics sur WhatsApp, téléphones et formulaires. Tout apparaît en temps réel sur le tableau de bord.',
        },
        {
          question: 'Puis-je tester avant de m\'abonner?',
          answer: 'Oui! Tous les plans payants incluent une période d\'essai gratuite. Free (0 jours), Starter (7 jours), Professional (14 jours), Enterprise (30 jours). Pas besoin de carte de crédit pour commencer.',
        },
        {
          question: 'Avez-vous un support en français?',
          answer: 'Oui! Tout notre support est en français, y compris la documentation, les tutoriels vidéo et le service par email/WhatsApp. Nous répondons sous 24 heures.',
        },
      ],
    },
    cta: {
      title: 'Prêt à Gérer Votre Empire Rank & Rent?',
      description: 'Rejoignez des centaines de professionnels SEO qui ont déjà transformé leurs entreprises',
      button: 'Commencer Essai Gratuit de 7 Jours',
      features: [
        'Sans carte de crédit',
        'Annulez quand vous voulez',
        'Support dédié',
      ],
    },
    footer: {
      product: {
        title: 'Produit',
        features: 'Fonctionnalités',
        pricing: 'Tarifs',
        start: 'Commencer',
        gsc: 'Indexation GSC',
      },
      resources: {
        title: 'Ressources',
        docs: 'Documentation',
        tutorials: 'Tutoriels',
        blog: 'Blog',
        faq: 'FAQ',
      },
      company: {
        title: 'Entreprise',
        about: 'À Propos',
        privacy: 'Politique de Confidentialité',
        terms: 'Conditions d\'Utilisation',
        contact: 'Contact',
      },
      support: {
        title: 'Support',
        help: 'Centre d\'Aide',
        status: 'État du Système',
        email: 'contact@rankitocrm.com',
        whatsapp: '+33 9 99 99 99 99',
      },
      copyright: '© 2024 Rankito CRM. Tous droits réservés.',
    },
    whoIsItFor: {
      badge: 'Public Cible',
      title: 'Pour Qui est Rankito CRM?',
      subtitle: 'Solution complète pour différents profils de professionnels gérant des sites web',
      cta: 'Commencer Gratuitement',
      profiles: [
        {
          title: 'Agences de Marketing Digital',
          description: 'Vous gérez des dizaines de sites pour des clients locaux, mais Google Analytics est trop complexe et vos clients ne comprennent pas les rapports techniques. Avec Rankito, vous générez des rapports visuels automatiques qui racontent une histoire claire - vos clients comprennent enfin le ROI et renouvellent les contrats.',
          example: 'Je gère 10-50 sites de clients locaux et j\'ai besoin de rapports qui ont du sens pour eux',
        },
        {
          title: 'Consultants SEO Freelance',
          description: 'Vous gérez 5 à 15 sites seul et perdez des heures à créer des rapports manuels dans des feuilles de calcul. Avec Rankito, vous automatisez tout le reporting et obtenez un portail client en marque blanche - pendant que vous dormez, vos clients suivent les performances en direct.',
          example: 'Je gère 5-15 sites seul et j\'ai besoin d\'automatiser le reporting',
        },
        {
          title: 'Professionnels de Génération de Leads',
          description: 'Vos sites génèrent des leads constamment, mais vous n\'avez pas de visibilité claire sur quelle page convertit le plus, quelle est l\'heure de pointe et combien chaque projet rapporte réellement. Rankito livre CRM simple + suivi précis + indexation automatique - vous voyez exactement ce qui fonctionne et vous faites évoluer ce qui donne des résultats.',
          example: 'Mes sites rank & rent génèrent des leads quotidiennement mais je ne connais pas le ROI exact de chaque projet',
        },
        {
          title: 'Petits E-commerces',
          description: 'Vous avez 50 à 500 produits dans la boutique, mais vous ne savez pas lesquels convertissent vraiment ni où les clients abandonnent le panier. Avec Rankito, vous voyez des analyses détaillées des produits et un entonnoir visuel complet - identifiez les goulots d\'étranglement et optimisez les ventes avec des données réelles, pas des suppositions.',
          example: 'J\'ai une boutique en ligne mais je ne sais pas quel produit se vend le plus et pourquoi',
        },
        {
          title: 'Gestionnaires de Portefeuille',
          description: 'Vous investissez dans 20+ sites différents et gérer tout manuellement est devenu un chaos total - feuilles de calcul cassées, sans connaître le ROI réel de chaque projet. Rankito consolide tout dans un tableau de bord unique avec ROI automatique par projet - vous savez enfin où mettre plus d\'argent et où couper.',
          example: 'J\'investis dans plusieurs sites mais j\'ai besoin d\'une vue consolidée du portefeuille',
        },
      ],
    },
    comparison: { badge: 'Pourquoi Rankito?', title: 'La Plateforme Qui Livre Ce Que D\'Autres Promettent', subtitle: 'Comparez fonctionnalités côte à côte', cta: 'Essayer Gratuitement 14 Jours', footer: '*Google Analytics est gratuit, mais vous perdez 10h/semaine à comprendre', headers: { feature: 'Fonctionnalité', googleAnalytics: 'Google Analytics', semrushAhrefs: 'SEMrush/Ahrefs', agencyAnalytics: 'AgencyAnalytics', rankito: 'Rankito CRM' }, rows: [{ feature: 'Complexité', googleAnalytics: { status: 'no', text: 'Courbe apprentissage élevée' }, semrushAhrefs: { status: 'no', text: 'Interface technique' }, agencyAnalytics: { status: 'partial', text: 'Axé SEO' }, rankito: { status: 'yes', text: 'Simple et visuel' } }, { feature: 'Parcours Utilisateur', googleAnalytics: { status: 'no', text: 'Flux confus' }, semrushAhrefs: { status: 'no', text: 'Non' }, agencyAnalytics: { status: 'no', text: 'Non' }, rankito: { status: 'yes', text: 'Page par page' } }, { feature: 'E-commerce', googleAnalytics: { status: 'partial', text: 'Configuration complexe' }, semrushAhrefs: { status: 'no', text: 'Seulement mots-clés' }, agencyAnalytics: { status: 'no', text: 'Non' }, rankito: { status: 'yes', text: 'Automatique' } }, { feature: 'Indexation GSC', googleAnalytics: { status: 'no', text: 'Non' }, semrushAhrefs: { status: 'partial', text: 'Surveille seulement' }, agencyAnalytics: { status: 'no', text: 'Non' }, rankito: { status: 'yes', text: 'Automatisation complète' } }, { feature: 'Portail Client', googleAnalytics: { status: 'no', text: 'Non' }, semrushAhrefs: { status: 'no', text: 'Non' }, agencyAnalytics: { status: 'yes', text: 'Oui' }, rankito: { status: 'yes', text: 'Whitelabel' } }, { feature: 'CRM Intégré', googleAnalytics: { status: 'no', text: 'Non' }, semrushAhrefs: { status: 'no', text: 'Non' }, agencyAnalytics: { status: 'no', text: 'Non' }, rankito: { status: 'yes', text: 'Pipeline + leads' } }, { feature: 'Rapports', googleAnalytics: { status: 'no', text: 'Vous créez' }, semrushAhrefs: { status: 'partial', text: 'Exporte données' }, agencyAnalytics: { status: 'yes', text: 'Oui' }, rankito: { status: 'yes', text: 'Automatiques' } }, { feature: 'Prix/mois', googleAnalytics: { status: 'partial', text: 'Gratuit*' }, semrushAhrefs: { status: 'no', text: '€500-2000' }, agencyAnalytics: { status: 'no', text: '€400-800' }, rankito: { status: 'yes', text: '€97-797' } }] },
    pillars: { badge: 'Notre Philosophie', title: 'Ce Qui Nous Rend Différents', subtitle: 'Principes guidant chaque fonctionnalité créée', items: [{ title: 'Clarté, Pas Complexité', description: 'Google Analytics montre 47 métriques. Vous avez besoin de 5 importantes. Rapports que votre client COMPREND, pas tableaux que personne ne lit.' }, { title: 'Action, Pas Seulement Données', description: 'Autres outils montrent données. Rankito montre QUOI FAIRE. Ce n\'est pas juste voir chiffres, c\'est indexer, suivre parcours, clôturer leads.' }, { title: 'Automatisation Totale', description: 'Arrêtez de passer 6 heures créant rapports. Générez en 2 clics. Indexation qui fonctionne seule. CRM qui capture leads automatiquement.' }, { title: 'Tout en Un Seul Endroit', description: 'Analytics + CRM + Financier + Portail Client + Indexation GSC. Un abonnement, zéro intégration cassée.' }] },
    roiCalculator: {
      badge: 'Calculateur d\'Économies',
      title: 'Combien Perdez-Vous Sans Rankito?',
      subtitle: 'Calculez vos économies mensuelles en temps et argent',
      cta: 'Commencez à Économiser - 14 Jours Gratuits',
      ctaSubtext: 'Sans carte bancaire. Annulez quand vous voulez.',
      inputs: {
        sites: { label: 'Combien de sites gérez-vous?', description: 'Nombre total de sites/projets sous gestion' },
        hours: { label: 'Combien d\'heures/semaine en tâches manuelles?', description: 'Rapports, indexation, analyse données, etc.' },
        rate: { label: 'Combien vaut votre heure? (€)', description: 'Valeur moyenne par heure de votre travail' },
      },
      results: {
        title: 'Votre Retour en Investissant dans Rankito',
        monthlySavings: 'Économies Mensuelles',
        timeSaved: 'Heures Économisées',
        month: 'mois',
        week: 'semaine',
        yearlyROI: 'ROI sur 12 Mois',
        roiPercentage: 'Retour sur Investissement',
        netProfit: 'Bénéfice Net Mensuel',
      },
      calculationLogic: {
        title: 'Comment Calculons-nous?',
        steps: {
          timePerSite: { title: 'Temps par site' },
          hoursSaved: { title: 'Heures économisées', description: 'de travail manuel éliminé' },
          monthlySavings: { title: 'Économies mensuelles brutes', weeks: 'semaines' },
          rankitoCost: { title: 'Coût Rankito', plan: 'Plan Professional' },
          netProfit: { title: 'Bénéfice net mensuel' },
        },
        footer: 'En 12 mois vous économisez {total} ({percentage}% ROI)',
      },
    },
  },
  'pt-PT': {
    nav: {
      features: 'Funcionalidades',
      gsc: 'Indexação GSC',
      pricing: 'Preços',
      faq: 'FAQ',
      login: 'Entrar',
      startFree: 'Começar Grátis',
    },
    hero: {
      badge: 'Rank & Rent CRM',
      title: 'Gira o Teu Império de Rank & Rent com Inteligência',
      painPoint: 'Para de perder dinheiro com sites sem controlo, conversões invisíveis e indexação manual que consome o teu tempo.',
      description: 'A única plataforma completa para profissionais de SEO que gerem portfolios de sites de geração de leads. Centraliza gestão, financeiro, CRM e indexação automática num só lugar.',
      ctaPrimary: 'Começar Grátis Agora',
      ctaSecondary: 'Ver Demonstração',
      socialProof: {
        sites: '200+ sites geridos',
        revenue: '€120K+ em receita',
        secure: 'Dados 100% seguros',
      },
    },
    problems: {
      title: 'Reconheces Estes Problemas?',
      items: [
        'Sites parados sem saber quais estão a converter',
        'Páginas criadas mas não indexadas pelo Google',
        'Horas perdidas em folhas de cálculo desorganizadas',
        'Cliente pede relatório e não tens dados',
        'Leads ligam e anotas em papel',
        'Sem saber o ROI real de cada projeto',
      ],
      conclusion: '👉 O Rankito CRM resolve TODOS estes problemas numa única plataforma.',
    },
    features: {
      badge: 'Funcionalidades',
      title: 'Tudo o Que Precisas Numa Plataforma',
      subtitle: 'Gere o teu portfolio com ferramentas profissionais',
      items: [
        {
          title: 'Painel Inteligente',
          description: 'Não sabes quais sites estão a converter e a perder dinheiro? Acompanha performance, receita, custos e ROI de todos os teus sites em tempo real. Métricas que importam, sem ruído.',
          benefits: [
            'Visão geral de todos os sites',
            'Receita e custos em tempo real',
            'ROI automático por projeto',
            'Alertas de performance',
          ],
          badge: 'Essencial',
        },
        {
          title: 'CRM Completo',
          description: 'Leads ligam, anotas em papel e esqueces de retornar? Captura leads automaticamente, gere deals, automatiza follow-ups e nunca mais percas uma oportunidade de negócio.',
          benefits: [
            'Pipeline visual de vendas',
            'Automatização de follow-ups',
            'Histórico completo de interações',
            'Integração com WhatsApp',
          ],
        },
        {
          title: 'Indexação Automática GSC',
          description: 'Cansado de indexar 5 páginas de cada vez manualmente no Search Console? Conecta a tua conta Google e indexa centenas de páginas automaticamente. Envia sitemaps, agenda indexações e monitoriza o estado em tempo real.',
          benefits: [
            'Indexação em massa (200+ URLs/dia)',
            'Agendamento automático',
            'Monitorização de estado',
            'Múltiplas contas GSC',
          ],
          badge: 'Exclusivo',
        },
        {
          title: 'E-commerce Tracking',
          description: 'Rastreia vendas, produtos e receita diretamente nos teus sites com tracking completo de e-commerce.',
          benefits: [
            'Plataforma pioneira com tracking de e-commerce completo',
            'Rastreamento automático de visualizações de produtos',
            'Captura de adições ao carrinho e checkouts',
            'Atribuição de receita por produto e página',
            'Funil completo: visualização → carrinho → compra',
            'Integração com Shopify, WooCommerce e sites HTML'
          ],
          badge: '🌍 Pioneira Mundial',
        },
        {
          title: 'Financeiro Completo',
          description: 'Folhas de cálculo desorganizadas e sem saber se estás a lucrar ou a perder? Regista receitas, custos, pagamentos e calcula ROI automaticamente. Sabe exatamente quanto cada site está a gerar.',
          benefits: [
            'Controlo de receitas e despesas',
            'ROI automático por site',
            'Histórico de pagamentos',
            'Projeções financeiras',
          ],
        },
        {
          title: 'Portal Whitelabel',
          description: 'Cliente pediu relatório e não tens nada para mostrar? Gera portais personalizados com o teu logo e cores. Os teus clientes acompanham performance sem aceder ao teu painel.',
          benefits: [
            'Personalização completa (logo, cores)',
            'Acesso seguro por link único',
            'Métricas em tempo real',
            'Relatórios automáticos',
          ],
        },
        {
          title: 'Analytics Avançado',
          description: 'Não sabes quantos leads cada página gerou hoje? Descobre quantos leads cada página gera, de onde vêm, quando acontecem. Pixel de tracking + integração WordPress.',
          benefits: [
            'Tracking de conversões por página',
            'Origem de tráfego detalhada',
            'Horários de pico',
            'Plugin WordPress incluído',
          ],
        },
        {
          title: 'Jornada do Utilizador',
          description: 'Não sabes por onde os teus visitantes navegam nem onde desistem? Rastreia cada passo da jornada do cliente - da entrada até à saída - com precisão de atirador. Vê sequências completas, tempo gasto por página e identifica estrangulamentos no funil.',
          benefits: [
            'Sequências completas de navegação página por página',
            'Tempo real gasto em cada etapa da jornada',
            'Identificação de bounce sessions e páginas problemáticas',
            'Análise comportamental de padrões de navegação',
            'Filtros inteligentes por volume de sessões',
          ],
        },
      ],
    },
    gsc: {
      badge: 'Chega de Perder Tempo',
      title: 'Para de Indexar 5 Páginas de Cada Vez Manualmente',
      painPoint: 'Tens 500 páginas criadas mas o Google só indexou 50? Estás a perder dinheiro todos os dias enquanto as tuas páginas ficam invisíveis.',
      description: 'A nossa indexação automática conecta ao Google Search Console e indexa centenas de páginas por dia. Sem esforço manual, sem perder oportunidades.',
      ctaButton: 'Começar a Indexar Agora',
      features: [
        {
          title: 'Indexação em Massa',
          description: 'Envia até 200 URLs por dia automaticamente para o Google Search Console. Multiplica isto por quantas contas conectares.',
        },
        {
          title: 'Agendamento Inteligente',
          description: 'Configura horários automáticos para submissão de sitemaps. O sistema gere tudo sem precisares de te lembrar.',
        },
        {
          title: 'Monitorização em Tempo Real',
          description: 'Acompanha o estado de cada URL: pendente, indexado, erro. Sabe exatamente o que está a acontecer com as tuas páginas.',
        },
      ],
    },
    ecommerce: {
      badge: '🎯 Monitorização Total',
      title: 'Rastreia Cada Clique e Indexa Todas as Páginas Automaticamente',
      painPoint: 'O teu site tem páginas invisíveis no Google? Não sabes quantos cliques cada produto recebe? Perdes vendas porque os produtos não aparecem nas pesquisas?',
      description: 'Monitoriza TODOS os cliques, visualizações e ações nas páginas dos teus sites. Indexa automaticamente no Google e Bing para máxima visibilidade. Tem clareza total do funil de conversão em tempo real.',
      ctaButton: 'Começar Monitorização Completa',
      highlight: '🏆 MONITORIZAÇÃO PERFEITA DE CLIQUES + INDEXAÇÃO AUTOMÁTICA = ZERO PÁGINAS INVISÍVEIS + VISÃO CLARA DO FUNIL',
      features: [
        {
          title: 'Monitorização de Todos os Cliques',
          description: 'Rastreia cada clique, visualização de produto, adição ao carrinho e conversão. Sabe exatamente como os visitantes interagem com as tuas páginas.',
        },
        {
          title: 'Indexação Automática Google + Bing',
          description: 'Todas as páginas são enviadas automaticamente para indexação. Zero páginas invisíveis nas pesquisas. Máxima cobertura orgânica sem trabalho manual.',
        },
        {
          title: 'Funil Completo de Conversão',
          description: 'Visualiza toda a jornada: Visualização → Interesse → Ação → Conversão. Identifica exatamente onde os visitantes abandonam e otimiza.',
        },
        {
          title: 'Clareza Total em Tempo Real',
          description: 'Painel mostra páginas mais clicadas, taxa de conversão por página, horários de pico, origem de tráfego e receita detalhada.',
        },
        {
          title: 'Funciona em Qualquer Plataforma',
          description: 'Compatível com Shopify, WooCommerce, WordPress e qualquer HTML. Pixel universal que rastreia tudo sem precisar configuração complexa.',
        },
      ],
    },
    userJourney: {
      badge: '🎯 Rastreamento Inteligente',
      title: 'Vê a Jornada Completa dos Teus Visitantes com Precisão de Sniper',
      painPoint: 'Sabes EXATAMENTE quais páginas os teus visitantes acedem, quanto tempo ficam e onde saem? Ou estás no escuro?',
      description: 'Sistema de rastreamento avançado que captura cada passo da jornada do utilizador - desde a primeira página até à conversão ou saída - com precisão milimétrica.',
      ctaButton: 'Ver Jornada em Ação',
      highlight: 'Descobre ONDE os teus visitantes estão a desistir e OTIMIZA o teu funil com dados reais',
      features: [
        {
          title: 'Sequências Completas',
          description: 'Vê o caminho exato que cada visitante faz: Início (2m34s) → Serviços (45s) → Contacto (1m12s). Não é só "X visualizações", é a jornada completa.',
        },
        {
          title: 'Tempo Real por Página',
          description: 'Cada segundo contabilizado. Sabe exatamente quanto tempo os visitantes gastam em cada etapa do funil. Precisão milimétrica.',
        },
        {
          title: 'Análise Comportamental',
          description: 'Identifica padrões de navegação mais comuns. Descobre as sequências que levam à conversão e as que levam ao abandono.',
        },
        {
          title: 'Sessões de Rebote',
          description: 'Visualiza páginas com alta taxa de saída. Entende onde 80% dos visitantes estão a abandonar o teu funil e corrige com dados reais.',
        },
      ],
    },
    pricing: {
      badge: 'Preços',
      title: 'Planos Para Todos os Tamanhos',
      description: 'Escolhe o plano ideal para o tamanho do teu portfolio',
      perMonth: '/mês',
      freeDays: 'dias grátis',
      popular: 'Mais Popular',
      subscribe: 'Subscrever',
      upTo: 'Até',
      unlimited: 'Ilimitado',
      sites: 'sites',
      pages: 'páginas por site',
      integrations: 'integrações GSC',
      commonFeatures: [
        'CRM completo',
        'Portal whitelabel',
        'Analytics avançado',
        'Financeiro completo',
        'Suporte prioritário',
      ],
      footer: '*Todos os planos incluem suporte técnico e atualizações gratuitas',
    },
    testimonials: {
      badge: 'Depoimentos',
      title: 'O Que Os Nossos Clientes Dizem',
      description: 'Profissionais de SEO que transformaram os seus negócios com Rankito CRM',
      items: [
        {
          name: 'Carlos Silva',
          role: 'CEO, Agência Digital Pro',
          text: 'Rankito CRM mudou completamente como gerimos o nosso portfolio de 30+ sites. A indexação automática no GSC poupa 8 horas por semana.',
          category: 'Agência SEO',
        },
        {
          name: 'Marina Santos',
          role: 'Consultora SEO',
          text: 'Finalmente tenho controlo financeiro total sobre os meus projetos. O ROI automático e o portal whitelabel impressionam os meus clientes.',
          category: 'Consultora',
        },
        {
          name: 'Ricardo Oliveira',
          role: 'Head de Growth',
          text: 'A integração com Google Search Console é simplesmente incrível. Nenhuma outra plataforma oferece isto de forma tão profissional.',
          category: 'Startup',
        },
        {
          name: 'Juliana Costa',
          role: 'Fundadora, LeadGen Brasil',
          text: 'O CRM integrado ajudou-me a fechar 40% mais contratos. Não perco mais nenhum lead e o pipeline é cristalino.',
          category: 'Agência Lead Gen',
        },
        {
          name: 'Pedro Alves',
          role: 'Especialista Rank & Rent',
          text: 'Giro 50 sites com facilidade. O tracking de conversões e os relatórios automáticos poupam dias de trabalho manual.',
          category: 'Especialista',
        },
        {
          name: 'Ana Paula',
          role: 'Diretora de Marketing',
          text: 'O portal do cliente é perfeito. Os meus clientes adoram a transparência e já não preciso de enviar relatórios manuais.',
          category: 'Marketing',
        },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Perguntas Frequentes',
      description: 'Esclarece as tuas dúvidas sobre o Rankito CRM',
      items: [
        {
          question: 'Como funciona a integração com Google Search Console?',
          answer: 'Conectas as tuas contas do GSC usando Service Account do Google Cloud. O sistema gere automaticamente a submissão de URLs e sitemaps, respeitando os limites diários do Google (200 URLs/dia por conta).',
        },
        {
          question: 'Posso conectar múltiplas contas do Google Search Console?',
          answer: 'Sim! Dependendo do teu plano, podes conectar múltiplas contas GSC. Isto multiplica a tua capacidade de indexação diária. Por exemplo, com 5 contas, podes indexar até 1000 URLs por dia.',
        },
        {
          question: 'O portal whitelabel é realmente personalizável?',
          answer: 'Sim! Podes adicionar o teu logo, definir cores primárias e secundárias, personalizar textos de boas-vindas e até configurar informações de contacto. Cada cliente tem o seu próprio link único e seguro.',
        },
        {
          question: 'Como funciona o tracking de conversões?',
          answer: 'Oferecemos um plugin WordPress que instala um pixel de tracking nas tuas páginas. Ele regista visualizações, cliques em WhatsApp, telefones e formulários. Tudo aparece em tempo real no painel.',
        },
        {
          question: 'Posso testar antes de subscrever?',
          answer: 'Sim! Todos os planos pagos incluem período de trial gratuito. Free (0 dias), Starter (7 dias), Professional (14 dias), Enterprise (30 dias). Não precisas de cartão de crédito para começar.',
        },
        {
          question: 'Têm suporte em português?',
          answer: 'Sim! Todo o nosso suporte é em português, incluindo documentação, tutoriais em vídeo e atendimento por email/WhatsApp. Respondemos em até 24 horas.',
        },
      ],
    },
    cta: {
      title: 'Pronto Para Gerir o Teu Império Rank & Rent?',
      description: 'Junta-te a centenas de profissionais de SEO que já transformaram os seus negócios',
      button: 'Começar Trial Gratuito de 7 Dias',
      features: [
        'Sem cartão de crédito',
        'Cancela quando quiseres',
        'Suporte dedicado',
      ],
    },
    footer: {
      product: {
        title: 'Produto',
        features: 'Funcionalidades',
        pricing: 'Preços',
        start: 'Começar Agora',
        gsc: 'Indexação GSC',
      },
      resources: {
        title: 'Recursos',
        docs: 'Documentação',
        tutorials: 'Tutoriais',
        blog: 'Blog',
        faq: 'FAQ',
      },
      company: {
        title: 'Empresa',
        about: 'Sobre Nós',
        privacy: 'Política de Privacidade',
        terms: 'Termos de Uso',
        contact: 'Contacto',
      },
      support: {
        title: 'Suporte',
        help: 'Centro de Ajuda',
        status: 'Estado do Sistema',
        email: 'contacto@rankitocrm.com',
        whatsapp: '+351 999 999 999',
      },
      copyright: '© 2024 Rankito CRM. Todos os direitos reservados.',
    },
    whoIsItFor: {
      badge: 'Público-Alvo',
      title: 'Para Quem é o Rankito CRM?',
      subtitle: 'Solução completa para diferentes perfis de profissionais que gerem sites',
      cta: 'Começar Gratuitamente',
      profiles: [
        {
          title: 'Agências de Marketing Digital',
          description: 'Gere dezenas de sites para clientes locais, mas o Google Analytics é demasiado complexo e os seus clientes não entendem relatórios técnicos. Com o Rankito, gera relatórios visuais automáticos que contam uma história clara - os seus clientes finalmente entendem o ROI e renovam contratos.',
          example: 'Giro 10-50 sites de clientes locais e preciso de relatórios que façam sentido para eles',
        },
        {
          title: 'Consultores SEO Freelancers',
          description: 'Gere 5 a 15 sites sozinho e perde horas a criar relatórios manuais em folhas de cálculo. Com o Rankito, automatiza todo o reporting e obtém um portal do cliente whitelabel - enquanto dorme, os seus clientes acompanham a performance ao vivo.',
          example: 'Giro 5-15 sites sozinho e preciso de automatizar o reporting',
        },
        {
          title: 'Profissionais de Geração de Leads',
          description: 'Os seus sites geram leads constantemente, mas não tem visibilidade clara de qual página converte mais, qual a hora de pico e quanto cada projeto realmente lucra. O Rankito entrega CRM simples + tracking preciso + indexação automática - vê exatamente o que funciona e escala o que dá resultado.',
          example: 'Os meus sites rank & rent geram leads diariamente mas não sei o ROI exato de cada projeto',
        },
        {
          title: 'Pequenos E-commerces',
          description: 'Tem 50 a 500 produtos na loja, mas não sabe quais realmente convertem nem onde os clientes abandonam o carrinho. Com o Rankito, vê analytics de produto detalhado e funil visual completo - identifica estrangulamentos e otimiza vendas com dados reais, não suposições.',
          example: 'Tenho loja online mas não sei qual produto vende mais e porquê',
        },
        {
          title: 'Gestores de Portfólio',
          description: 'Investe em 20+ sites diferentes e gerir tudo manualmente tornou-se caos total - folhas de cálculo partidas, sem saber ROI real de cada projeto. O Rankito consolida tudo num dashboard único com ROI automático por projeto - finalmente sabe onde colocar mais dinheiro e onde cortar.',
          example: 'Invisto em múltiplos sites mas preciso de visão consolidada do portfólio',
        },
      ],
    },
    comparison: { badge: 'Porquê Rankito?', title: 'A Plataforma Que Faz o Que Outras Só Prometem', subtitle: 'Compare funcionalidades lado a lado', cta: 'Experimente Grátis por 14 Dias', footer: '*Google Analytics é grátis, mas perde 10h/semana a tentar entender', headers: { feature: 'Recurso', googleAnalytics: 'Google Analytics', semrushAhrefs: 'SEMrush/Ahrefs', agencyAnalytics: 'AgencyAnalytics', rankito: 'Rankito CRM' }, rows: [{ feature: 'Complexidade', googleAnalytics: { status: 'no', text: 'Alta curva aprendizagem' }, semrushAhrefs: { status: 'no', text: 'Interface técnica' }, agencyAnalytics: { status: 'partial', text: 'Focado SEO' }, rankito: { status: 'yes', text: 'Simples e visual' } }, { feature: 'Jornada Utilizador', googleAnalytics: { status: 'no', text: 'Fluxos confusos' }, semrushAhrefs: { status: 'no', text: 'Não tem' }, agencyAnalytics: { status: 'no', text: 'Não tem' }, rankito: { status: 'yes', text: 'Página por página' } }, { feature: 'E-commerce', googleAnalytics: { status: 'partial', text: 'Setup complexo' }, semrushAhrefs: { status: 'no', text: 'Só keywords' }, agencyAnalytics: { status: 'no', text: 'Não tem' }, rankito: { status: 'yes', text: 'Automático' } }, { feature: 'Indexação GSC', googleAnalytics: { status: 'no', text: 'Não tem' }, semrushAhrefs: { status: 'partial', text: 'Só monitoriza' }, agencyAnalytics: { status: 'no', text: 'Não tem' }, rankito: { status: 'yes', text: 'Automação completa' } }, { feature: 'Portal Cliente', googleAnalytics: { status: 'no', text: 'Não tem' }, semrushAhrefs: { status: 'no', text: 'Não tem' }, agencyAnalytics: { status: 'yes', text: 'Tem' }, rankito: { status: 'yes', text: 'Whitelabel' } }, { feature: 'CRM Integrado', googleAnalytics: { status: 'no', text: 'Não tem' }, semrushAhrefs: { status: 'no', text: 'Não tem' }, agencyAnalytics: { status: 'no', text: 'Não tem' }, rankito: { status: 'yes', text: 'Pipeline + leads' } }, { feature: 'Relatórios', googleAnalytics: { status: 'no', text: 'Cria você' }, semrushAhrefs: { status: 'partial', text: 'Exporta dados' }, agencyAnalytics: { status: 'yes', text: 'Tem' }, rankito: { status: 'yes', text: 'Automáticos' } }, { feature: 'Preço/mês', googleAnalytics: { status: 'partial', text: 'Grátis*' }, semrushAhrefs: { status: 'no', text: '€500-2000' }, agencyAnalytics: { status: 'no', text: '€400-800' }, rankito: { status: 'yes', text: '€97-797' } }] },
    pillars: { badge: 'Nossa Filosofia', title: 'O Que Nos Torna Diferentes', subtitle: 'Princípios que guiam cada funcionalidade criada', items: [{ title: 'Clareza, Não Complexidade', description: 'Google Analytics mostra 47 métricas. Precisa de 5 que importam. Relatórios que seu cliente ENTENDE, não tabelas que ninguém lê.' }, { title: 'Ação, Não Apenas Dados', description: 'Outras ferramentas mostram dados. Rankito mostra O QUE FAZER. Não é só ver números, é indexar, acompanhar jornada, fechar leads.' }, { title: 'Automação Total', description: 'Pare de gastar 6 horas criando relatórios. Gere em 2 cliques. Indexação que funciona sozinha. CRM que captura leads automaticamente.' }, { title: 'Tudo em Um Só Lugar', description: 'Analytics + CRM + Financeiro + Portal Cliente + Indexação GSC. Uma mensalidade, zero integrações quebradas.' }] },
    roiCalculator: {
      badge: 'Calculadora de Poupança',
      title: 'Quanto Está a Perder Sem Rankito?',
      subtitle: 'Calcule sua poupança mensal em tempo e dinheiro',
      cta: 'Comece a Poupar Agora - 14 Dias Grátis',
      ctaSubtext: 'Sem cartão. Cancele quando quiser.',
      inputs: {
        sites: { label: 'Quantos sites gere?', description: 'Número total de sites/projetos sob gestão' },
        hours: { label: 'Quantas horas/semana em tarefas manuais?', description: 'Relatórios, indexação, análise dados, etc.' },
        rate: { label: 'Quanto vale sua hora? (€)', description: 'Valor médio por hora do seu trabalho' },
      },
      results: {
        title: 'O Seu Retorno Investindo no Rankito',
        monthlySavings: 'Poupança Mensal',
        timeSaved: 'Horas Poupadas',
        month: 'mês',
        week: 'semana',
        yearlyROI: 'ROI em 12 Meses',
        roiPercentage: 'Retorno do Investimento',
        netProfit: 'Lucro Líquido Mensal',
      },
      calculationLogic: {
        title: 'Como Calculamos?',
        steps: {
          timePerSite: { title: 'Tempo por site' },
          hoursSaved: { title: 'Horas poupadas', description: 'de trabalho manual eliminado' },
          monthlySavings: { title: 'Poupança mensal bruta', weeks: 'semanas' },
          rankitoCost: { title: 'Custo Rankito', plan: 'Plano Professional' },
          netProfit: { title: 'Lucro líquido mensal' },
        },
        footer: 'Em 12 meses poupa {total} ({percentage}% ROI)',
      },
    },
  },
};
