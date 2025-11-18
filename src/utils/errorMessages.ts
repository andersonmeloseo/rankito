/**
 * Sistema de mensagens de erro amigáveis e contextuais
 */

export interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

// Mapa de erros do Postgres/Supabase
const DATABASE_ERRORS: Record<string, ErrorMessage> = {
  'row-level security': {
    title: 'Acesso negado',
    description: 'Você não tem permissão para realizar esta ação.',
    action: 'Entre em contato com o administrador'
  },
  'not-null': {
    title: 'Campos obrigatórios',
    description: 'Alguns campos obrigatórios não foram preenchidos.',
    action: 'Verifique se todos os campos estão preenchidos'
  },
  'foreign key': {
    title: 'Registro vinculado',
    description: 'Este item não pode ser excluído pois está vinculado a outros registros.',
    action: 'Remova os vínculos antes de excluir'
  },
  'unique constraint': {
    title: 'Registro duplicado',
    description: 'Já existe um registro com estas informações.',
    action: 'Use informações diferentes'
  },
  '23505': {
    title: 'Registro duplicado',
    description: 'Já existe um registro com estas informações.',
    action: 'Use informações diferentes'
  },
  'P0001': {
    title: 'Limite atingido',
    description: '',
    action: 'Faça upgrade do seu plano'
  }
};

// Mapa de erros de rede
const NETWORK_ERRORS: Record<number, ErrorMessage> = {
  400: {
    title: 'Requisição inválida',
    description: 'Os dados enviados estão incorretos.',
    action: 'Verifique os campos e tente novamente'
  },
  401: {
    title: 'Não autorizado',
    description: 'Você precisa estar logado para realizar esta ação.',
    action: 'Faça login e tente novamente'
  },
  403: {
    title: 'Acesso negado',
    description: 'Você não tem permissão para acessar este recurso.',
    action: 'Entre em contato com o administrador'
  },
  404: {
    title: 'Não encontrado',
    description: 'O recurso solicitado não foi encontrado.',
    action: 'Verifique se a URL está correta'
  },
  429: {
    title: 'Muitas requisições',
    description: 'Você excedeu o limite de requisições.',
    action: 'Aguarde alguns minutos e tente novamente'
  },
  500: {
    title: 'Erro no servidor',
    description: 'Ocorreu um erro interno no servidor.',
    action: 'Tente novamente em alguns instantes'
  },
  503: {
    title: 'Serviço indisponível',
    description: 'O serviço está temporariamente indisponível.',
    action: 'Tente novamente em alguns minutos'
  }
};

/**
 * Extrai mensagem amigável de qualquer tipo de erro
 */
export function getErrorMessage(
  error: unknown,
  context?: string
): ErrorMessage {
  // Erro customizado já tratado
  if (error && typeof error === 'object' && 'title' in error) {
    return error as ErrorMessage;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // 1. Verificar se é erro de limite (P0001)
  if (errorMessage.includes('Limite de') || errorMessage.includes('P0001')) {
    return {
      title: 'Limite atingido',
      description: errorMessage.replace('P0001:', '').trim(),
      action: 'Faça upgrade do seu plano para continuar'
    };
  }

  // 2. Verificar erros do banco de dados
  for (const [key, message] of Object.entries(DATABASE_ERRORS)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return {
        ...message,
        description: message.description || errorMessage
      };
    }
  }

  // 3. Verificar erros HTTP por código de status
  const statusMatch = errorMessage.match(/\b(\d{3})\b/);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1]);
    if (NETWORK_ERRORS[statusCode]) {
      return NETWORK_ERRORS[statusCode];
    }
  }

  // 4. Erros específicos de contexto
  if (context) {
    return {
      title: `Erro ao ${context}`,
      description: errorMessage || 'Ocorreu um erro inesperado.',
      action: 'Tente novamente ou entre em contato com o suporte'
    };
  }

  // 5. Fallback genérico
  return {
    title: 'Erro inesperado',
    description: errorMessage || 'Ocorreu um erro desconhecido.',
    action: 'Tente novamente ou entre em contato com o suporte'
  };
}

/**
 * Erros específicos por funcionalidade
 */
export const CONTEXT_ERRORS = {
  sitemap: {
    fetch_failed: {
      title: 'Falha ao acessar sitemap',
      description: 'Não foi possível carregar o sitemap da URL fornecida.',
      action: 'Verifique se a URL está correta e acessível'
    },
    invalid_format: {
      title: 'Formato inválido',
      description: 'O arquivo não é um sitemap XML válido.',
      action: 'Verifique se o arquivo segue o padrão de sitemaps'
    },
    no_urls: {
      title: 'Sitemap vazio',
      description: 'O sitemap não contém nenhuma URL.',
      action: 'Verifique se o sitemap está preenchido corretamente'
    },
    too_large: {
      title: 'Sitemap muito grande',
      description: 'O sitemap contém mais URLs do que o permitido.',
      action: 'Divida o sitemap em partes menores ou faça upgrade'
    }
  },
  gsc: {
    quota_exceeded: {
      title: 'Cota GSC esgotada',
      description: 'Você atingiu o limite diário de requisições do Google Search Console.',
      action: 'Aguarde até amanhã ou use outra integração'
    },
    auth_failed: {
      title: 'Autenticação GSC falhou',
      description: 'Não foi possível autenticar com o Google Search Console.',
      action: 'Reconecte sua conta do Google'
    },
    property_not_found: {
      title: 'Propriedade não encontrada',
      description: 'A propriedade do Google Search Console não foi encontrada.',
      action: 'Verifique se você tem acesso à propriedade'
    }
  },
  plugin: {
    not_installed: {
      title: 'Rastreamento não detectado',
      description: 'O código de rastreamento não está instalado ou não está enviando dados.',
      action: 'Verifique a instalação do pixel ou aguarde alguns minutos'
    },
    connection_failed: {
      title: 'Falha na conexão',
      description: 'Não foi possível verificar o rastreamento.',
      action: 'Tente novamente em alguns instantes'
    }
  },
  tracking: {
    invalid_token: {
      title: 'Token inválido',
      description: 'O token de rastreamento fornecido não é válido.',
      action: 'Verifique o token nas configurações do projeto'
    },
    site_offline: {
      title: 'Site inacessível',
      description: 'O site não está respondendo às requisições.',
      action: 'Verifique se o site está online'
    }
  }
};
