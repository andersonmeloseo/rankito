import { 
  Home, Globe, FileText, Download, Settings, TestTube,
  Search, FileSearch, Send, Calendar, BarChart, Route, 
  FileBarChart, CheckCircle2, Key, Upload, List, Play
} from "lucide-react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  action?: string;
  actionLabel?: string;
  category: string;
  isOptional?: boolean;
}

export interface TutorialCategory {
  id: string;
  title: string;
  icon: any;
  steps: TutorialStep[];
}

export const tutorialSteps: TutorialStep[] = [
  // CONFIGURAÇÃO INICIAL
  {
    id: "welcome",
    title: "Bem-vindo ao Rankito CRM! 🎉",
    description: "Bem-vindo ao sistema completo de gestão de sites. Este tutorial vai guiá-lo por todas as funcionalidades do Rankito CRM, desde a criação de projetos até a geração de relatórios profissionais.",
    icon: Home,
    category: "setup",
  },
  {
    id: "create-project",
    title: "Crie seu Primeiro Projeto",
    description: "Clique no botão 'Adicionar Projeto' no topo da página e preencha as informações básicas do seu site: nome do projeto, URL, nicho e localização. Este será o ponto central de todas as suas análises.",
    icon: Globe,
    action: "add-site",
    actionLabel: "Adicionar Projeto",
    category: "setup",
  },
  {
    id: "import-sitemap",
    title: "Importe o Sitemap",
    description: "Vá em Projetos → clique no projeto criado → aba 'Sitemap' → clique em 'Importar Sitemap'. Digite a URL do sitemap do seu site (exemplo: https://seusite.com/sitemap.xml) e clique em 'Descobrir Sitemaps'. O sistema irá extrair todas as páginas automaticamente.",
    icon: FileText,
    action: "view-projects",
    actionLabel: "Ver Projetos",
    category: "setup",
  },

  // RASTREAMENTO
  {
    id: "install-wordpress",
    title: "Instale o Plugin WordPress",
    description: "(Se o site for WordPress) Vá em Projetos → seu projeto → aba 'Plugin WordPress' → clique em 'Baixar Plugin WordPress'. Instale o plugin no painel do WordPress do seu site (Plugins → Adicionar novo → Enviar plugin).",
    icon: Download,
    category: "tracking",
  },
  {
    id: "configure-wordpress",
    title: "Configure o Plugin",
    description: "No Rankito, copie a 'URL de Rastreamento' que aparece acima do botão de download. No WordPress do seu site, vá em Configurações → Rank & Rent Tracker, cole a URL no campo, salve e clique em 'Conectar'. Volte ao Rankito e verifique se aparece 'Conectado'.",
    icon: Settings,
    category: "tracking",
  },
  {
    id: "install-pixel",
    title: "Instale o Pixel Universal",
    description: "(Se NÃO for WordPress) Vá em Projetos → seu projeto → aba 'Pixel & E-commerce' → copie o código do pixel. Cole este código no <head> do seu site, antes do fechamento da tag </head>.",
    icon: FileSearch,
    category: "tracking",
  },
  {
    id: "test-connection",
    title: "Teste a Conexão",
    description: "Após instalar o plugin WordPress ou o pixel universal, volte à aba correspondente no Rankito e clique no botão 'Testar Conexão'. Aguarde alguns segundos e verifique se o status muda para 'Conectado' com ícone verde.",
    icon: TestTube,
    category: "tracking",
  },

  // GOOGLE SEARCH CONSOLE
  {
    id: "setup-gsc",
    title: "Configure o Google Search Console",
    description: "Vá em Projetos → seu projeto → aba 'Indexador' → passo 'Configuração'. Siga o tutorial passo a passo para criar uma Service Account no Google Cloud Console, habilitar as APIs necessárias e colar o JSON da conta de serviço. Depois clique em 'Testar Conexão'.",
    icon: Key,
    action: "setup-gsc",
    actionLabel: "Ir para Configuração",
    category: "gsc",
  },
  {
    id: "discover-pages",
    title: "Descubra Páginas (Passo 1)",
    description: "Na aba 'Indexador', clique no passo 1 'Descobrir'. Você será direcionado para a sub-aba 'Indexação GSC'. Clique em 'Passo 1: Descobrir Páginas'. O sistema irá buscar as páginas do seu sitemap e prepará-las para indexação.",
    icon: Search,
    category: "gsc",
  },
  {
    id: "process-sitemap-gsc",
    title: "Processe o Sitemap (Passo 2)",
    description: "Ainda na sub-aba 'Indexação GSC', clique em 'Passo 2: Processar Sitemap'. O sistema irá validar todas as URLs descobertas e verificar quais estão prontas para indexação no Google.",
    icon: FileSearch,
    category: "gsc",
  },
  {
    id: "index-urls",
    title: "Indexe URLs (Passo 3)",
    description: "Clique em 'Passo 3: Indexação de URLs'. O sistema começará a enviar suas URLs para o Google Search Console. Lembre-se: cada conexão GSC permite 200 URLs por dia. Confira o card 'Quota Diária' para monitorar o uso.",
    icon: Upload,
    category: "gsc",
  },
  {
    id: "sitemap-gsc",
    title: "Envie Sitemaps ao GSC",
    description: "Na sub-aba 'Indexação GSC', clique em 'Por Sitemap'. Clique na bolinha ao lado esquerdo de 'URL do Sitemap' para selecionar todos os sitemaps. Depois clique no botão 'Enviar para Indexação no GSC'. Sempre que novas páginas forem criadas, clique em 'Buscar Sitemaps no GSC' para atualizar.",
    icon: Send,
    category: "gsc",
  },
  {
    id: "page-gsc",
    title: "Envie Páginas Individuais",
    description: "Na sub-aba 'Indexação GSC', clique em 'Por Página'. Clique na bolinha ao lado de 'URL' para selecionar todas as páginas. Depois clique em 'Validar URLs' e em seguida 'Enviar para Indexação GSC'. Lembre: cada conexão permite 200 URLs/dia (verifique o card de quota).",
    icon: List,
    category: "gsc",
  },

  // INDEXNOW
  {
    id: "setup-indexnow",
    title: "Configure o IndexNow",
    description: "Clique na sub-aba 'IndexNow'. Crie um arquivo .txt no diretório raiz do seu site com o nome que aparece no bloco 'Chave IndexNow' (exemplo: 12345abc67890def.txt). Dentro deste arquivo, cole apenas a chave (números e letras). NÃO clique em 'Regenerar', pois isso criará uma nova chave.",
    icon: Key,
    category: "indexnow",
  },
  {
    id: "send-indexnow",
    title: "Envie URLs ao IndexNow",
    description: "Clique no botão 'Abrir Arquivo de Validação' para verificar se o arquivo foi criado corretamente. Se abrir mostrando sua chave, volte ao Rankito e clique em 'Validar Chave'. Depois, selecione as URLs clicando na bolinha ao lado de 'URL' (ou use 'Selecionar Todas') e clique em 'Enviar ao IndexNow'. Limite: 1000 URLs/dia.",
    icon: Send,
    category: "indexnow",
  },

  // AGENDAMENTO
  {
    id: "scheduling",
    title: "Crie Agendamentos (Opcional)",
    description: "Se precisar automatizar o envio de URLs, vá na sub-aba 'Agendamento', clique em 'Novo Agendamento' e configure a frequência (horária, diária, semanal), horário específico e quantas URLs enviar por execução. O sistema enviará automaticamente conforme configurado.",
    icon: Calendar,
    category: "scheduling",
    isOptional: true,
  },

  // ANALYTICS & RELATÓRIOS
  {
    id: "analytics",
    title: "Explore o Analytics Avançado",
    description: "Clique em 'Analytics Avançado' no menu do projeto. Navegue pelas sub-abas 'Visão Geral' (métricas gerais), 'Conversões' (todas as ações dos visitantes) e 'Page Views' (visualizações de páginas). Entenda o desempenho completo do seu site.",
    icon: BarChart,
    action: "view-analytics",
    actionLabel: "Ver Analytics",
    category: "analytics",
  },
  {
    id: "user-journey",
    title: "Acompanhe a Jornada do Usuário",
    description: "Vá na aba 'Jornada do Usuário' para ver o caminho completo que cada visitante percorre no seu site: página de entrada (🟢), páginas navegadas (🔵), página de saída (🔴), tempo em cada página, CTAs clicados, localização, dispositivo e duração total da sessão.",
    icon: Route,
    category: "analytics",
  },
  {
    id: "reports",
    title: "Gere Relatórios Profissionais",
    description: "Clique na aba 'Relatórios' para criar relatórios visuais e profissionais para seus clientes. Selecione o período, personalize métricas e exporte em PDF. Os relatórios são automaticamente formatados e prontos para apresentação.",
    icon: FileBarChart,
    action: "view-reports",
    actionLabel: "Gerar Relatório",
    category: "analytics",
  },
];

export const tutorialCategories: TutorialCategory[] = [
  {
    id: "setup",
    title: "Configuração Inicial",
    icon: Home,
    steps: tutorialSteps.filter(s => s.category === "setup"),
  },
  {
    id: "tracking",
    title: "Rastreamento",
    icon: Play,
    steps: tutorialSteps.filter(s => s.category === "tracking"),
  },
  {
    id: "gsc",
    title: "Google Search Console",
    icon: Search,
    steps: tutorialSteps.filter(s => s.category === "gsc"),
  },
  {
    id: "indexnow",
    title: "IndexNow",
    icon: Send,
    steps: tutorialSteps.filter(s => s.category === "indexnow"),
  },
  {
    id: "scheduling",
    title: "Agendamento",
    icon: Calendar,
    steps: tutorialSteps.filter(s => s.category === "scheduling"),
  },
  {
    id: "analytics",
    title: "Analytics & Relatórios",
    icon: BarChart,
    steps: tutorialSteps.filter(s => s.category === "analytics"),
  },
];
